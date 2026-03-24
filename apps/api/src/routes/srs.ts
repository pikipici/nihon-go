import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SrsService } from "../services/srs.service";
import { StreakService } from "../services/streak.service";

const reviewSchema = z.object({
  cardId: z.string(),
  rating: z.number().min(1).max(4),
});

export async function srsRoutes(app: FastifyInstance) {
  const svc       = new SrsService(app);
  const streakSvc = new StreakService(app);

  app.addHook("preHandler", app.authenticate);

  app.get("/due-today", async (req, reply) => {
    const limit = Number((req.query as any).limit) || 20;
    const cards = await svc.getDueCards(req.user.sub, limit);
    return reply.send({ cards, total: cards.length });
  });

  app.post("/review", async (req, reply) => {
    const r = reviewSchema.safeParse(req.body);
    if (!r.success) return reply.status(400).send({ error: r.error.flatten().fieldErrors });

    const { cardId, rating } = r.data;
    const userId = req.user.sub;

    const card = await svc.review(cardId, userId, rating as 1 | 2 | 3 | 4);

    // +2 XP kalau jawaban benar (rating >= 3)
    let xpAwarded = 0;
    if (rating >= 3) {
      xpAwarded = 2;
      await streakSvc.addXp(userId, xpAwarded, "srs-correct-review");
    }

    // Update streak
    const streak = await streakSvc.updateStreak(userId);

    return reply.send({ card, xpAwarded, streak });
  });

  app.get("/stats", async (req, reply) => {
    const [srsStats, streakInfo] = await Promise.all([
      svc.getStats(req.user.sub),
      streakSvc.getStreakInfo(req.user.sub),
    ]);
    return reply.send({ stats: { ...srsStats, ...streakInfo } });
  });

  app.get("/streak", async (req, reply) => {
    const info = await streakSvc.getStreakInfo(req.user.sub);
    if (!info) return reply.status(404).send({ error: "User tidak ditemukan" });
    return reply.send({ streak: info });
  });
}
