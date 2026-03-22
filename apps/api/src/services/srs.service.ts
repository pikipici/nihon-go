import type { FastifyInstance } from "fastify";

// SM-2 rating: 1=Again 2=Hard 3=Good 4=Easy
export class SrsService {
  constructor(private app: FastifyInstance) {}

  async getDueCards(userId: string, limit = 20) {
    return this.app.prisma.srsCard.findMany({
      where: { userId, nextReviewAt: { lte: new Date() } },
      take: limit,
      orderBy: { nextReviewAt: "asc" },
      include: { vocabulary: true, kanji: true },
    });
  }

  async review(cardId: string, userId: string, rating: 1 | 2 | 3 | 4) {
    const card = await this.app.prisma.srsCard.findFirst({ where: { id: cardId, userId } });
    if (!card) throw { statusCode: 404, message: "Kartu tidak ditemukan" };

    let { easeFactor, intervalDays, repetitions } = card;

    if (rating === 1) {
      // Again — reset
      repetitions  = 0;
      intervalDays = 1;
      easeFactor   = Math.max(1.3, easeFactor - 0.2);
    } else {
      // Successful recall
      if (repetitions === 0)      intervalDays = 1;
      else if (repetitions === 1) intervalDays = 6;
      else                        intervalDays = Math.round(intervalDays * easeFactor);

      if (rating === 2) easeFactor = Math.max(1.3, easeFactor - 0.15);      // Hard
      if (rating === 4) easeFactor = Math.min(2.5, easeFactor + 0.15);      // Easy
      repetitions++;
    }

    const nextReviewAt = new Date(Date.now() + intervalDays * 86400_000);

    return this.app.prisma.srsCard.update({
      where: { id: cardId },
      data: { easeFactor, intervalDays, repetitions, nextReviewAt, lastReviewedAt: new Date() },
    });
  }

  async addCard(userId: string, itemType: "VOCABULARY" | "KANJI", itemId: string) {
    const where =
      itemType === "VOCABULARY"
        ? { userId, itemType, vocabularyId: itemId }
        : { userId, itemType, kanjiId: itemId };

    const existing = await this.app.prisma.srsCard.findFirst({ where });
    if (existing) return existing;

    const data: Record<string, unknown> = { userId, itemType, nextReviewAt: new Date() };
    if (itemType === "VOCABULARY") data.vocabularyId = itemId;
    if (itemType === "KANJI")      data.kanjiId      = itemId;

    return this.app.prisma.srsCard.create({ data: data as any });
  }

  async getStats(userId: string) {
    const [total, dueToday, reviewed] = await Promise.all([
      this.app.prisma.srsCard.count({ where: { userId } }),
      this.app.prisma.srsCard.count({ where: { userId, nextReviewAt: { lte: new Date() } } }),
      this.app.prisma.srsCard.count({ where: { userId, lastReviewedAt: { gte: new Date(Date.now() - 86400_000) } } }),
    ]);
    return { total, dueToday, reviewedToday: reviewed };
  }
}
