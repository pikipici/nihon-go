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
        const data: any = { userId, itemType, nextReviewAt: new Date() };
        if (itemType === "VOCABULARY") data.vocabularyId = itemId;
        if (itemType === "KANJI")      data.kanjiId      = itemId;
        await app.prisma.srsCard.upsert({
          where: itemType === "VOCABULARY"
            ? { userId_itemType_vocabularyId: { userId, itemType, vocabularyId: itemId } }
            : { userId_itemType_kanjiId:      { userId, itemType, kanjiId: itemId } },
          update: {},
          create: data,
        });
      }
      app.log.info(`SRS: added ${itemIds.length} ${itemType} cards for user ${userId}`);
    },
    { connection }
  );
}
