import type { FastifyInstance } from "fastify";

export class StreakService {
  constructor(private app: FastifyInstance) {}

  async updateStreak(userId: string): Promise<{
    streakCount: number;
    wasIncremented: boolean;
    wasReset: boolean;
  }> {
    const user = await this.app.prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, lastActivityAt: true },
    });

    if (!user) return { streakCount: 0, wasIncremented: false, wasReset: false };

    const now       = new Date();
    const last      = user.lastActivityAt;
    const diffHours = last ? (now.getTime() - last.getTime()) / (1000 * 60 * 60) : 999;

    let newStreak      = user.streakCount;
    let wasIncremented = false;
    let wasReset       = false;

    if (diffHours < 24) {
      // Hari yang sama — tidak berubah
    } else if (diffHours < 48) {
      newStreak      = user.streakCount + 1;
      wasIncremented = true;
    } else {
      newStreak = 1;
      wasReset  = true;
    }

    await this.app.prisma.user.update({
      where: { id: userId },
      data:  { streakCount: newStreak, lastActivityAt: now },
    });

    // Bonus XP setiap 7 hari streak
    if (wasIncremented && newStreak % 7 === 0) {
      await this.addXp(userId, 50, `streak-bonus-${newStreak}`);
    }

    return { streakCount: newStreak, wasIncremented, wasReset };
  }

  async addXp(userId: string, amount: number, reason?: string): Promise<number> {
    const updated = await this.app.prisma.user.update({
      where: { id: userId },
      data:  { xpTotal: { increment: amount } },
      select: { xpTotal: true },
    });
    if (reason) this.app.log.info(`XP +${amount} untuk user ${userId} (${reason})`);
    return updated.xpTotal;
  }

  async getStreakInfo(userId: string) {
    const user = await this.app.prisma.user.findUnique({
      where:  { id: userId },
      select: { streakCount: true, xpTotal: true, lastActivityAt: true },
    });
    if (!user) return null;

    const diffHours    = user.lastActivityAt
      ? (Date.now() - user.lastActivityAt.getTime()) / (1000 * 60 * 60)
      : 999;

    return {
      streakCount:    user.streakCount,
      xpTotal:        user.xpTotal,
      studiedToday:   diffHours < 24,
      atRisk:         diffHours >= 20 && diffHours < 48,
      lastActivityAt: user.lastActivityAt,
    };
  }
}
