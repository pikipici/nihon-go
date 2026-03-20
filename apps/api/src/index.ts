import "dotenv/config";
import Fastify from "fastify";
import { prismaPlugin } from "./plugins/prisma";
import { redisPlugin } from "./plugins/redis";
import { jwtPlugin } from "./plugins/jwt";
import { corsPlugin } from "./plugins/cors";
import { authRoutes } from "./routes/auth";
import { userRoutes } from "./routes/users";
import { onboardingRoutes } from "./routes/onboarding";
import { contentRoutes } from "./routes/content";
import { srsRoutes } from "./routes/srs";

const REQUIRED_ENV = ["DATABASE_URL", "REDIS_URL", "JWT_SECRET", "COOKIE_SECRET"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`❌ Missing env var: ${key}`);
}

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "warn" : "info",
    transport: process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  },
});

async function bootstrap() {
  await app.register(corsPlugin);
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);

  await app.register(authRoutes,       { prefix: "/auth" });
  await app.register(userRoutes,       { prefix: "/users" });
  await app.register(onboardingRoutes, { prefix: "/onboarding" });
  await app.register(contentRoutes,    { prefix: "/content" });
  await app.register(srsRoutes,        { prefix: "/srs" });

  app.get("/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 API running → http://localhost:${port}`);
}

bootstrap().catch((err) => { console.error(err); process.exit(1); });
