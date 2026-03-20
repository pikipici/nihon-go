import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { SrsService } from "../services/srs.service";

const reviewSchema = z.object({ cardId: z.string(), rating: z.number().min(1).max(4) });

export async function srsRoutes(app: FastifyInstance) {
  const svc = new SrsService(app);
  app.addHook("preHandler", app.authenticate);

  app.get("/due-today", async (req, reply) => {
    const limit = Number((req.query as any).limit) || 20;
    const cards = await svc.getDueCards(req.user.sub, limit);
    return reply.send({ cards, total: cards.length });
  });

  app.post("/review", async (req, reply) => {
    const r = reviewSchema.safeParse(req.body);
    if (!r.success) return reply.status(400).send({ error: r.error.flatten().fieldErrors });
    const card = await svc.review(r.data.cardId, req.user.sub, r.data.rating as 1|2|3|4);
    return reply.send({ card });
  });

  app.get("/stats", async (req, reply) => {
    const stats = await svc.getStats(req.user.sub);
    return reply.send({ stats });
  });
}
