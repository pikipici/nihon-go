import type { FastifyInstance } from "fastify";
import { z } from "zod";

const pageQ = z.object({ level: z.enum(["N5","N4","N3","N2","N1","JFT"]).optional(), limit: z.coerce.number().min(1).max(100).default(20), offset: z.coerce.number().default(0), search: z.string().optional(), type: z.string().optional() });

export async function contentRoutes(app: FastifyInstance) {
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
    const lesson = await app.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) return reply.status(404).send({ error: "Tidak ditemukan" });
    const progress = await app.prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: req.user.sub, lessonId: id } },
      update: { status:"COMPLETED", score, timeSpentSecs: timeSpentSecs ?? 0, completedAt: new Date() },
      create: { userId: req.user.sub, lessonId: id, status:"COMPLETED", score, timeSpentSecs: timeSpentSecs ?? 0, completedAt: new Date() },
    });

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const user = await app.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { lastActivityAt: true, streakCount: true },
    });

    if (user) {
      const lastActivity = user.lastActivityAt;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = user.streakCount;

      if (!lastActivity) {
        newStreak = 1;
      } else {
        const lastDate = new Date(lastActivity);
        lastDate.setHours(0, 0, 0, 0);

        if (lastDate.getTime() === yesterday.getTime()) {
          // Belajar kemarin → streak naik
          newStreak = user.streakCount + 1;
        } else if (lastDate.getTime() < yesterday.getTime()) {
          // Skip sehari → streak reset
          newStreak = 1;
        }
        // Hari yang sama → streak tidak berubah
      }

      await app.prisma.user.update({
        where: { id: req.user.sub },
        data: {
          xpTotal: { increment: lesson.xpReward },
          streakCount: newStreak,
          lastActivityAt: new Date(),
        },
      });
    }

    return reply.send({ progress, xpAwarded: lesson.xpReward });
  });
}
