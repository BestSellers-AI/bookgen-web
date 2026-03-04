import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { ChangePlanDto } from './dto/change-plan.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('current')
  async getCurrent(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getActive(userId);
  }

  @Post('cancel')
  async cancel(
    @CurrentUser('id') userId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancel(userId, dto.atPeriodEnd);
  }

  @Post('change-plan')
  async changePlan(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionService.changePlan(
      userId,
      dto.planSlug,
      dto.billingInterval,
    );
  }

  @Get('upcoming-invoice')
  async getUpcomingInvoice(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getUpcomingInvoice(userId);
  }
}
