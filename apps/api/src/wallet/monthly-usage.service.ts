import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';
import { FreeRegens, SUBSCRIPTION_PLANS } from '@bestsellers/shared';

@Injectable()
export class MonthlyUsageService {
  private readonly logger = new Logger(MonthlyUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create a MonthlyUsage record for the current month.
   */
  async getOrCreate(
    userId: string,
    plan: SubscriptionPlan | null,
  ) {
    const month = this.getCurrentMonth();
    const freeRegensLimit = plan ? SUBSCRIPTION_PLANS[plan].freeRegensPerMonth : 0;

    const usage = await this.prisma.monthlyUsage.upsert({
      where: {
        userId_month: { userId, month },
      },
      create: {
        userId,
        month,
        freeRegensUsed: 0,
        freeRegensLimit,
      },
      update: {},
    });

    return usage;
  }

  /**
   * Get free regenerations info for the current month.
   */
  async getFreeRegens(
    userId: string,
    plan: SubscriptionPlan | null,
  ): Promise<FreeRegens> {
    const usage = await this.getOrCreate(userId, plan);
    const resetsAt = this.getFirstDayNextMonth();

    return {
      used: usage.freeRegensUsed,
      limit: usage.freeRegensLimit,
      resetsAt,
    };
  }

  /**
   * Use a free regeneration if available. Returns true if successful, false if limit reached.
   */
  async useFreeRegen(
    userId: string,
    plan: SubscriptionPlan | null,
  ): Promise<boolean> {
    const usage = await this.getOrCreate(userId, plan);

    if (usage.freeRegensUsed >= usage.freeRegensLimit) {
      return false;
    }

    await this.prisma.monthlyUsage.update({
      where: { id: usage.id },
      data: { freeRegensUsed: { increment: 1 } },
    });

    this.logger.log(
      `User ${userId} used free regen (${usage.freeRegensUsed + 1}/${usage.freeRegensLimit})`,
    );
    return true;
  }

  /**
   * Get the current month in "YYYY-MM" format.
   */
  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get the first day of next month as an ISO string.
   */
  private getFirstDayNextMonth(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }
}
