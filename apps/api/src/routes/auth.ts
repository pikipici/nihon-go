import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AuthService } from "../services/auth.service";

const COOKIE = "refresh_token";
const COOKIE_OPTS = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

const registerSchema = z.object({ email: z.string().email(), name: z.string().min(2), password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/) });
const loginSchema    = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function authRoutes(app: FastifyInstance) {
  const svc = new AuthService(app);

  app.post("/register", async (req, reply) => {
    const r = registerSchema.safeParse(req.body);
    if (!r.success) return reply.status(400).send({ error: r.error.flatten().fieldErrors });
    try {
      const user = await svc.register(r.data);
      return reply.status(201).send({ message: "Registrasi berhasil", user });
    } catch (e: any) { return reply.status(e.statusCode ?? 500).send({ error: e.message }); }
  });

  app.post("/login", async (req, reply) => {
    const r = loginSchema.safeParse(req.body);
    if (!r.success) return reply.status(400).send({ error: "Validasi gagal" });
    try {
      const { accessToken, refreshToken, user } = await svc.login(r.data, { userAgent: req.headers["user-agent"], ipAddress: req.ip });
      reply.setCookie(COOKIE, refreshToken, COOKIE_OPTS);
      return reply.send({ accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, subscriptionTier: user.subscriptionTier } });
    } catch (e: any) { return reply.status(e.statusCode ?? 500).send({ error: e.message }); }
  });

  app.post("/refresh", async (req, reply) => {
    const token = req.cookies[COOKIE] ?? (req.body as any)?.refreshToken;
    if (!token) return reply.status(401).send({ error: "Refresh token tidak ditemukan" });
    try {
      const { accessToken, refreshToken } = await svc.refresh(token);
      reply.setCookie(COOKIE, refreshToken, COOKIE_OPTS);
      return reply.send({ accessToken });
    } catch (e: any) { reply.clearCookie(COOKIE); return reply.status(e.statusCode ?? 500).send({ error: e.message }); }
  });

  app.delete("/logout",     { preHandler: [app.authenticate] }, async (req, reply) => {
    const t = req.cookies[COOKIE]; if (t) await svc.logout(t);
    reply.clearCookie(COOKIE); return reply.status(204).send();
  });

  app.delete("/logout-all", { preHandler: [app.authenticate] }, async (req, reply) => {
    await svc.logoutAll(req.user.sub);
    reply.clearCookie(COOKIE); return reply.status(204).send();
  });

  app.get("/google", async (_req, reply) => {
    const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: process.env.GOOGLE_CALLBACK_URL!, response_type: "code", scope: "openid email profile" });
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get("/google/callback", async (req, reply) => {
    const { code } = req.query as { code?: string };
    if (!code) return reply.status(400).send({ error: "No code" });
    try {
      const tokenRes  = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: process.env.GOOGLE_CALLBACK_URL!, grant_type: "authorization_code" }) });
      const tokens    = await tokenRes.json() as { id_token: string };
      const payload   = JSON.parse(Buffer.from(tokens.id_token.split(".")[1]!, "base64url").toString()) as { sub: string; email: string; name: string; picture: string };
      const { accessToken, refreshToken } = await svc.loginWithGoogle({ id: payload.sub, email: payload.email, name: payload.name, picture: payload.picture }, { userAgent: req.headers["user-agent"], ipAddress: req.ip });
      reply.setCookie(COOKIE, refreshToken, COOKIE_OPTS);
      return reply.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (e: any) { return reply.status(500).send({ error: e.message }); }
  });

  app.get("/me", { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: req.user.sub }, select: { id: true, email: true, name: true, avatarUrl: true, role: true, subscriptionTier: true, currentLevel: true, targetExam: true, targetExamDate: true, streakCount: true, xpTotal: true } });
    if (!user) return reply.status(404).send({ error: "User tidak ditemukan" });
    return reply.send({ user });
  });
}
