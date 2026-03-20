import type { FastifyInstance } from "fastify";
import { z } from "zod";

const submitSchema = z.object({ answers: z.array(z.object({ questionId: z.string(), selectedIndex: z.number().min(0).max(3) })).min(3) });
const planSchema   = z.object({ targetExam: z.enum(["N5","N4","N3","N2","N1","JFT"]), targetDate: z.string().datetime(), dailyMinutes: z.number().min(10).max(240).default(30) });

const QUESTIONS = [
  { id:"n5-1", level:"N5", question:"Arti kata 'ねこ' adalah...", options:["Anjing","Kucing","Burung","Ikan"], correct:1 },
  { id:"n5-2", level:"N5", question:"Cara baca '山' adalah...", options:["うみ","かわ","やま","そら"], correct:2 },
  { id:"n5-3", level:"N5", question:"Partikel yang tepat: 私___学生です", options:["を","に","は","で"], correct:2 },
  { id:"n4-1", level:"N4", question:"Arti '電話' adalah...", options:["Televisi","Telepon","Komputer","Radio"], correct:1 },
  { id:"n4-2", level:"N4", question:"'まえに' berarti...", options:["Setelah","Selama","Sebelum","Ketika"], correct:2 },
  { id:"n3-1", level:"N3", question:"'意識' artinya...", options:["Perasaan","Kesadaran","Ingatan","Pikiran"], correct:1 },
];

function calcLevel(answers: {questionId:string; selectedIndex:number}[]) {
  const byLevel: Record<string,{c:number;t:number}> = { N5:{c:0,t:0}, N4:{c:0,t:0}, N3:{c:0,t:0} };
  for (const a of answers) {
    const q = QUESTIONS.find(q => q.id === a.questionId);
    if (!q) continue;
    byLevel[q.level]!.t++;
    if (a.selectedIndex === q.correct) byLevel[q.level]!.c++;
  }
  if ((byLevel.N3?.t ?? 0) > 0 && byLevel.N3!.c / byLevel.N3!.t >= 0.7) return "N3";
  if ((byLevel.N4?.t ?? 0) > 0 && byLevel.N4!.c / byLevel.N4!.t >= 0.7) return "N4";
  return "N5";
}

export async function onboardingRoutes(app: FastifyInstance) {
  app.get("/placement/questions", async (_req, reply) => {
    const safe = QUESTIONS.map(({ correct: _c, ...q }) => q);
    return reply.send({ questions: safe });
  });

  app.post("/placement/submit", { preHandler: [app.authenticate] }, async (req, reply) => {
    const r = submitSchema.safeParse(req.body);
    if (!r.success) return reply.status(400).send({ error: r.error.flatten().fieldErrors });
    const total   = r.data.answers.length;
    const correct = r.data.answers.filter(a => QUESTIONS.find(q => q.id === a.questionId)?.correct === a.selectedIndex).length;
    const level   = calcLevel(r.data.answers) as any;
    const score   = Math.round(correct / total * 100);
    await app.prisma.placementTest.create({ data: { userId: req.user.sub, questions: r.data.answers.map(a=>a.questionId) as any, answers: r.data.answers as any, score, resultLevel: level } });
    await app.prisma.user.update({ where: { id: req.user.sub }, data: { currentLevel: level } });
    return reply.send({ result: { level, score, totalQuestions: total } });
  });

  app.post("/study-plan", { preHandler: [app.authenticate] }, async (req, reply) => {
    const r = planSchema.safeParse(req.body);
    if (!r.success) return reply.status(400).send({ error: r.error.flatten().fieldErrors });
    const targetDate = new Date(r.data.targetDate);
    const daysLeft   = Math.ceil((targetDate.getTime() - Date.now()) / 86400_000);
    if (daysLeft < 7) return reply.status(400).send({ error: "Tanggal ujian terlalu dekat (minimal 7 hari)" });
    const weeksLeft  = Math.floor(daysLeft / 7);
    const plan = await app.prisma.studyPlan.upsert({
      where: { userId: req.user.sub },
      update: { targetExam: r.data.targetExam, targetDate, dailyMinutes: r.data.dailyMinutes, weeklyPlan: { weeksLeft, daysLeft } as any },
      create: { userId: req.user.sub, targetExam: r.data.targetExam, targetDate, dailyMinutes: r.data.dailyMinutes, weeklyPlan: { weeksLeft, daysLeft } as any },
    });
    await app.prisma.user.update({ where: { id: req.user.sub }, data: { targetExam: r.data.targetExam, targetExamDate: targetDate } });
    return reply.status(201).send({ plan: { ...plan, daysLeft, weeksLeft } });
  });

  app.get("/study-plan", { preHandler: [app.authenticate] }, async (req, reply) => {
    const plan = await app.prisma.studyPlan.findUnique({ where: { userId: req.user.sub } });
    if (!plan) return reply.status(404).send({ error: "Study plan belum dibuat" });
    return reply.send({ plan });
  });
}
