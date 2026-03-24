import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { StreakService } from "../services/streak.service";

const pageQ = z.object({ level: z.enum(["N5","N4","N3","N2","N1","JFT"]).optional(), limit: z.coerce.number().min(1).max(100).default(20), offset: z.coerce.number().default(0), search: z.string().optional(), type: z.string().optional() });

export async function contentRoutes(app: FastifyInstance) {
  const streakSvc = new StreakService(app);

  app.get("/vocabulary", async (req, reply) => {
    const q = pageQ.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Query tidak valid" });
    const { level, limit, offset, search } = q.data;
    const where: any = {};
    if (level) where.jlptLevel = level;
    if (search) where.OR = [{ word: { contains: search } }, { reading: { contains: search } }, { meaning: { contains: search, mode: "insensitive" } }];
    const [items, total] = await Promise.all([app.prisma.vocabulary.findMany({ where, take: limit, skip: offset, orderBy: { word: "asc" } }), app.prisma.vocabulary.count({ where })]);
    return reply.send({ items, total, limit, offset });
  });

  app.get("/vocabulary/:id", async (req, reply) => {
    const item = await app.prisma.vocabulary.findUnique({ where: { id: (req.params as any).id } });
    if (!item) return reply.status(404).send({ error: "Tidak ditemukan" });
    return reply.send({ item });
  });

  app.get("/kanji", async (req, reply) => {
    const q = pageQ.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Query tidak valid" });
    const { level, limit, offset, search } = q.data;
    const where: any = {};
    if (level) where.jlptLevel = level;
    if (search) where.OR = [{ character: { contains: search } }, { meaning: { contains: search, mode: "insensitive" } }];
    const [items, total] = await Promise.all([app.prisma.kanji.findMany({ where, take: limit, skip: offset }), app.prisma.kanji.count({ where })]);
    return reply.send({ items, total, limit, offset });
  });

  app.get("/kanji/:character", async (req, reply) => {
    const item = await app.prisma.kanji.findUnique({ where: { character: (req.params as any).character } });
    if (!item) return reply.status(404).send({ error: "Tidak ditemukan" });
    return reply.send({ item });
  });

  app.get("/grammar", async (req, reply) => {
    const q = pageQ.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Query tidak valid" });
    const { level, limit, offset } = q.data;
    const where: any = {};
    if (level) where.jlptLevel = level;
    const [items, total] = await Promise.all([app.prisma.grammarPoint.findMany({ where, take: limit, skip: offset }), app.prisma.grammarPoint.count({ where })]);
    return reply.send({ items, total, limit, offset });
  });

  app.get("/lessons", { preHandler: [app.authenticate] }, async (req, reply) => {
    const q = pageQ.safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "Query tidak valid" });
    const { level, type, limit, offset } = q.data;
    const where: any = {};
    if (level) where.level = level;
    if (type)  where.type  = type.toUpperCase();
    const [lessons, total] = await Promise.all([app.prisma.lesson.findMany({ where, take: limit, skip: offset, orderBy: [{ level:"asc" },{ orderIndex:"asc" }] }), app.prisma.lesson.count({ where })]);
    const progressMap = new Map((await app.prisma.userProgress.findMany({ where: { userId: req.user.sub, lessonId: { in: lessons.map(l=>l.id) } }, select: { lessonId:true, status:true, score:true } })).map(p => [p.lessonId, p]));
    return reply.send({ lessons: lessons.map(l => ({ ...l, userProgress: progressMap.get(l.id) ?? { status:"NOT_STARTED", score:null } })), total });
  });

  app.get("/lessons/:id", { preHandler: [app.authenticate] }, async (req, reply) => {
    const lesson = await app.prisma.lesson.findUnique({ where: { id: (req.params as any).id } });
    if (!lesson) return reply.status(404).send({ error: "Tidak ditemukan" });
    if (lesson.prerequisites.length > 0) {
      const done = await app.prisma.userProgress.count({ where: { userId: req.user.sub, lessonId: { in: lesson.prerequisites }, status: "COMPLETED" } });
      if (done < lesson.prerequisites.length) return reply.status(403).send({ error: "Selesaikan lesson sebelumnya dulu", prerequisites: lesson.prerequisites });
    }
    const progress = await app.prisma.userProgress.findUnique({ where: { userId_lessonId: { userId: req.user.sub, lessonId: lesson.id } } });
    return reply.send({ lesson, progress: progress ?? { status: "NOT_STARTED" } });
  });

  app.post("/lessons/:id/complete", { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const { score, timeSpentSecs } = (req.body as any) ?? {};
    const userId = req.user.sub;

    const lesson = await app.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return reply.status(404).send({ error: "Tidak ditemukan" });

    // ── 1. Update progress ─────────────────────────────────────────────────
    const progress = await app.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: id } },
      update: { status: "COMPLETED", score, timeSpentSecs: timeSpentSecs ?? 0, completedAt: new Date() },
      create: { userId, lessonId: id, status: "COMPLETED", score, timeSpentSecs: timeSpentSecs ?? 0, completedAt: new Date() },
    });

    // ── 2. Award XP ────────────────────────────────────────────────────────
    await app.prisma.user.update({
      where: { id: userId },
      data: { xpTotal: { increment: lesson.xpReward } },
    });

    // ── 3. Update streak via StreakService ─────────────────────────────
    const streakResult = await streakSvc.updateStreak(userId);

    // ── 4. Auto-add SRS cards ──────────────────────────────────────────────
    let srsAdded = 0;
    const content = lesson.contentJson as any;
    const lessonType = lesson.type;

    try {
      if (lessonType === "VOCABULARY" || lessonType === "HIRAGANA" || lessonType === "KATAKANA") {
        // Ambil vocab berdasarkan level lesson
        const vocabList = await app.prisma.vocabulary.findMany({
          where: { jlptLevel: lesson.level },
          take: content?.wordCount ?? 20,
          orderBy: { createdAt: "asc" },
        });

        for (const vocab of vocabList) {
          await app.prisma.srsCard.upsert({
            where: {
              userId_itemType_vocabularyId: {
                userId,
                itemType: "VOCABULARY",
                vocabularyId: vocab.id,
              },
            },
            update: {}, // sudah ada — tidak update
            create: {
              userId,
              itemType: "VOCABULARY",
              vocabularyId: vocab.id,
              nextReviewAt: new Date(), // due sekarang — bisa review langsung
            },
          });
          srsAdded++;
        }
      }

      if (lessonType === "KANJI") {
        // Ambil kanji dari contentJson.kanjiList kalau ada
        const kanjiChars: string[] = content?.kanjiList ?? [];

        if (kanjiChars.length > 0) {
          const kanjiList = await app.prisma.kanji.findMany({
            where: { character: { in: kanjiChars } },
          });

          for (const kanji of kanjiList) {
            await app.prisma.srsCard.upsert({
              where: {
                userId_itemType_kanjiId: {
                  userId,
                  itemType: "KANJI",
                  kanjiId: kanji.id,
                },
              },
              update: {},
              create: {
                userId,
                itemType: "KANJI",
                kanjiId: kanji.id,
                nextReviewAt: new Date(),
              },
            });
            srsAdded++;
          }
        } else {
          // Fallback: ambil semua kanji di level ini
          const kanjiList = await app.prisma.kanji.findMany({
            where: { jlptLevel: lesson.level },
            take: 10,
          });

          for (const kanji of kanjiList) {
            await app.prisma.srsCard.upsert({
              where: {
                userId_itemType_kanjiId: {
                  userId,
                  itemType: "KANJI",
                  kanjiId: kanji.id,
                },
              },
              update: {},
              create: {
                userId,
                itemType: "KANJI",
                kanjiId: kanji.id,
                nextReviewAt: new Date(),
              },
            });
            srsAdded++;
          }
        }
      }
    } catch (srsErr) {
      // SRS error tidak boleh gagalkan lesson complete
      app.log.warn("SRS auto-add error:", srsErr);
    }

    return reply.send({
      progress,
      xpAwarded: lesson.xpReward,
      srsCardsAdded: srsAdded,
      streak: streakResult,
    });
  });
}
