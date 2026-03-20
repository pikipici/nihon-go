import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";

export const corsPlugin = fp(async (app) => {
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
});
