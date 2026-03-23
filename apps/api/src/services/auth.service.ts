import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { FastifyInstance } from "fastify";
import type { JwtPayload } from "../plugins/jwt";

const REFRESH_DAYS = 30;

export class AuthService {
  constructor(private app: FastifyInstance) {}

  signAccess(payload: JwtPayload) { return this.app.jwt.sign(payload); }
  genRefresh()                    { return crypto.randomBytes(64).toString("hex"); }
  hashPassword(p: string)         { return bcrypt.hash(p, 12); }
  verifyPassword(p: string, h: string) { return bcrypt.compare(p, h); }

  async register(data: { email: string; name: string; password: string }) {
    if (await this.app.prisma.user.findUnique({ where: { email: data.email } }))
      throw { statusCode: 409, message: "Email sudah terdaftar" };
    return this.app.prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash: await this.hashPassword(data.password) },
      select: { id: true, email: true, name: true, role: true, subscriptionTier: true },
    });
  }

  async login(data: { email: string; password: string }, meta: { userAgent?: string; ipAddress?: string }) {
    const user = await this.app.prisma.user.findUnique({ where: { email: data.email } });
    if (!user?.passwordHash || !await this.verifyPassword(data.password, user.passwordHash))
      throw { statusCode: 401, message: "Email atau password salah" };
    return this.createSession(user, meta);
  }

  async loginWithGoogle(g: { id: string; email: string; name: string; picture?: string }, meta: any) {
    // Cek apakah email sudah terdaftar (register biasa)
    const existingUser = await this.app.prisma.user.findUnique({
      where: { email: g.email },
    });

    let user;
    if (existingUser) {
      // Email sudah ada — update googleId dan data profil
      user = await this.app.prisma.user.update({
        where: { email: g.email },
        data: {
          googleId: g.id,
          avatarUrl: g.picture ?? existingUser.avatarUrl,
          emailVerified: true,
        },
      });
    } else {
      // User baru via Google
      user = await this.app.prisma.user.create({
        data: {
          googleId: g.id,
          email: g.email,
          name: g.name,
          avatarUrl: g.picture,
          emailVerified: true,
        },
      });
    }

    return this.createSession(user, meta);
  }

  private async createSession(user: any, meta: any) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role, tier: user.subscriptionTier };
    const accessToken  = this.signAccess(payload);
    const refreshToken = this.genRefresh();
    const expiresAt    = new Date(Date.now() + REFRESH_DAYS * 86400_000);
    await this.app.prisma.session.create({ data: { userId: user.id, refreshToken, expiresAt, ...meta } });
    await this.app.prisma.user.update({ where: { id: user.id }, data: { lastActivityAt: new Date() } });
    return { accessToken, refreshToken, user };
  }

  async refresh(token: string) {
    const session = await this.app.prisma.session.findUnique({ where: { refreshToken: token }, include: { user: true } });
    if (!session || session.expiresAt < new Date()) {
      if (session) await this.app.prisma.session.delete({ where: { id: session.id } });
      throw { statusCode: 401, message: "Refresh token tidak valid" };
    }
    const newRefresh  = this.genRefresh();
    const newExpiry   = new Date(Date.now() + REFRESH_DAYS * 86400_000);
    await this.app.prisma.session.update({ where: { id: session.id }, data: { refreshToken: newRefresh, expiresAt: newExpiry } });
    const payload: JwtPayload = { sub: session.user.id, email: session.user.email, role: session.user.role, tier: session.user.subscriptionTier };
    return { accessToken: this.signAccess(payload), refreshToken: newRefresh };
  }

  logout(token: string)     { return this.app.prisma.session.deleteMany({ where: { refreshToken: token } }); }
  logoutAll(userId: string) { return this.app.prisma.session.deleteMany({ where: { userId } }); }
}
