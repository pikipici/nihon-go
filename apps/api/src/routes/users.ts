import type { FastifyInstance } from "fastify";
import { z } from "zod";

const updateSchema = z.object({
  name:          z.string().min(2).max(80).optional(),
  avatarUrl:     z.string().url().optional(),
  targetExam:    z.enum(["N5","N4","N3","N2","N1","JFT"]).optional(),
  targetExamDate:z.string().datetime().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/me", async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id:true, email:true, name:true, avatarUrl:true, role:true, subscriptionTier:true, currentLevel:true, targetExam:true, targetExamDate:true, streakCount:true, xpTotal:true, lastActivityAt:true, createdAt:true },
    });
    if (!user) return reply.status(404).send({ error: "Tidak ditemukan" });
    return reply.send({ user });
  });

  app.patch("/me", async (req, reply) => {
    const r = updateSchema.safeParse(req.body);
    if (!r.success) return reply.status(400).send({ error: r.error.flatten().fieldErrors });
    const updated = await app.prisma.user.update({
      where: { id: req.user.sub },
      data: { ...r.data, targetExamDate: r.data.targetExamDate ? new Date(r.data.targetExamDate) : undefined },
      select: { id:true, email:true, name:true, avatarUrl:true, currentLevel:true, targetExam:true, targetExamDate:true },
    });
    return reply.send({ user: updated });
  });

  app.get("/me/stats", async (req, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { streakCount:true, xpTotal:true, currentLevel:true, targetExam:true, targetExamDate:true },
    });
    if (!user) return reply.status(404).send({ error: "Tidak ditemukan" });
    const daysUntilExam = user.targetExamDate ? Math.ceil((user.targetExamDate.getTime() - Date.now()) / 86400_000) : null;
    return reply.send({ stats: { ...user, daysUntilExam } });
  });
}
