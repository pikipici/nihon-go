import type { FastifyInstance } from "fastify";
import { z } from "zod";

const submitSchema = z.object({ answers: z.array(z.object({ questionId: z.string(), selectedIndex: z.number().min(0).max(3) })).min(3) });
const planSchema   = z.object({ targetExam: z.enum(["N5","N4","N3","N2","N1","JFT"]), targetDate: z.string().datetime(), dailyMinutes: z.number().min(10).max(240).default(30) });

const QUESTIONS = [
  // ── N5 — Hiragana & Katakana ─────────────────────────────────────────────
  { id:"n5-1", level:"N5", question:"Pilih cara baca yang benar untuk: ねこ", options:["Neko (Kucing)","Inu (Anjing)","Sakana (Ikan)","Tori (Burung)"], correct:0 },
  { id:"n5-2", level:"N5", question:"Arti kata 'みず' adalah...", options:["Api","Angin","Air","Tanah"], correct:2 },
  { id:"n5-3", level:"N5", question:"Cara baca kanji '山' adalah...", options:["うみ","かわ","やま","そら"], correct:2 },
  { id:"n5-4", level:"N5", question:"Partikel yang tepat: 私___学生です", options:["を","に","は","で"], correct:2 },
  { id:"n5-5", level:"N5", question:"Bentuk negatif sopan dari '食べます' adalah...", options:["食べません","食べないです","食べなかった","食べない"], correct:0 },
  { id:"n5-6", level:"N5", question:"Arti '大きい' adalah...", options:["Kecil","Besar","Panjang","Pendek"], correct:1 },
  { id:"n5-7", level:"N5", question:"Partikel tujuan yang tepat: 学校___行きます", options:["は","が","を","に"], correct:3 },
  { id:"n5-8", level:"N5", question:"Cara baca '日本語' adalah...", options:["にほんご","にっぽんご","にほんごう","にっぽんごう"], correct:0 },

  // ── N4 ────────────────────────────────────────────────────────────────────
  { id:"n4-1", level:"N4", question:"Arti '電話' adalah...", options:["Televisi","Telepon","Komputer","Radio"], correct:1 },
  { id:"n4-2", level:"N4", question:"'まえに' berarti...", options:["Setelah","Selama","Sebelum","Ketika"], correct:2 },
  { id:"n4-3", level:"N4", question:"Bentuk て形 dari '食べる' adalah...", options:["食べて","食べった","食べんで","食べいて"], correct:0 },
  { id:"n4-4", level:"N4", question:"Arti '〜てもいいです' adalah...", options:["Harus melakukan","Boleh melakukan","Tidak boleh melakukan","Sedang melakukan"], correct:1 },
  { id:"n4-5", level:"N4", question:"'連絡する' artinya...", options:["Menelepon","Menghubungi","Bertemu","Menyetujui"], correct:1 },
  { id:"n4-6", level:"N4", question:"Cara baca '電車' adalah...", options:["でんわ","でんき","でんしゃ","てんしゃ"], correct:2 },
  { id:"n4-7", level:"N4", question:"'〜なければなりません' berarti...", options:["Boleh tidak","Harus","Mungkin","Ingin"], correct:1 },
  { id:"n4-8", level:"N4", question:"Arti '丁寧' (ていねい) adalah...", options:["Kasar","Santai","Sopan/Teliti","Cepat"], correct:2 },

  // ── N3 ────────────────────────────────────────────────────────────────────
  { id:"n3-1", level:"N3", question:"'意識' (いしき) artinya...", options:["Perasaan","Kesadaran","Ingatan","Pikiran"], correct:1 },
  { id:"n3-2", level:"N3", question:"'〜にもかかわらず' berarti...", options:["Meskipun/Walaupun","Karena","Setelah","Sebelum"], correct:0 },
  { id:"n3-3", level:"N3", question:"'〜はずがない' menyatakan...", options:["Seharusnya terjadi","Tidak mungkin terjadi","Mungkin terjadi","Sudah terjadi"], correct:1 },
  { id:"n3-4", level:"N3", question:"Arti '複雑' (ふくざつ) adalah...", options:["Sederhana","Rumit/Kompleks","Mudah","Jelas"], correct:1 },

  // ── N2 ────────────────────────────────────────────────────────────────────
  { id:"n2-1", level:"N2", question:"'曖昧' (あいまい) berarti...", options:["Jelas","Ambigu/Tidak jelas","Pasti","Tepat"], correct:1 },
  { id:"n2-2", level:"N2", question:"'〜に反して' berarti...", options:["Sesuai dengan","Bertentangan dengan","Bersamaan dengan","Tergantung pada"], correct:1 },
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
