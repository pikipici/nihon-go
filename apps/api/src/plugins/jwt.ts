import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import type { FastifyRequest, FastifyReply } from "fastify";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tier: string;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin:  (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest { user: JwtPayload; }
}

declare module "@fastify/jwt" {
  interface FastifyJWT { payload: JwtPayload; user: JwtPayload; }
}

export const jwtPlugin = fp(async (app) => {
  await app.register(fastifyCookie, { secret: process.env.COOKIE_SECRET!, hook: "onRequest" });
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: process.env.JWT_ACCESS_EXPIRES ?? "15m" },
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try { await req.jwtVerify(); }
    catch { return reply.status(401).send({ error: "Unauthorized" }); }
  });

  app.decorate("requireAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      if (!["ADMIN", "SUPERADMIN"].includes(req.user.role))
        return reply.status(403).send({ error: "Forbidden" });
    } catch { return reply.status(401).send({ error: "Unauthorized" }); }
  });
});
