import type { FastifyReply } from "fastify";

export function ok<T>(reply: FastifyReply, data: T, status = 200) {
  return reply.status(status).send(data);
}

export function err(reply: FastifyReply, message: string, status = 500) {
  return reply.status(status).send({ error: message });
}

export function paginated<T>(reply: FastifyReply, items: T[], total: number, limit: number, offset: number) {
  return reply.send({ items, total, limit, offset });
}
