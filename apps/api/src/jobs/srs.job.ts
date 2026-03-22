import { Queue, Worker } from "bullmq";
import type { FastifyInstance } from "fastify";

export const SRS_QUEUE = "srs-cards";

export interface AddCardsJobData {
  userId:   string;
  lessonId: string;
  itemType: "VOCABULARY" | "KANJI";
  itemIds:  string[];
}

export function createSrsQueue(redisUrl: string) {
  const connection = { url: redisUrl };
  return new Queue<AddCardsJobData>(SRS_QUEUE, { connection });
}

export function createSrsWorker(redisUrl: string, app: FastifyInstance) {
  const connection = { url: redisUrl };
  return new Worker<AddCardsJobData>(
    SRS_QUEUE,
    async (job) => {
      const { userId, itemType, itemIds } = job.data;
      for (const itemId of itemIds) {
        const where =
          itemType === "VOCABULARY"
            ? { userId, itemType, vocabularyId: itemId }
            : { userId, itemType, kanjiId: itemId };

        const existing = await app.prisma.srsCard.findFirst({ where });
        if (existing) continue;

        const data: Record<string, unknown> = { userId, itemType, nextReviewAt: new Date() };
        if (itemType === "VOCABULARY") data.vocabularyId = itemId;
        if (itemType === "KANJI")      data.kanjiId      = itemId;

        await app.prisma.srsCard.create({ data: data as any });
      }
      app.log.info(`SRS: added ${itemIds.length} ${itemType} cards for user ${userId}`);
    },
    { connection }
  );
}
