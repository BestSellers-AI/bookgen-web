import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutSessionDto } from './dto';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('create-session')
  async createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.checkoutService.createSession(userId, dto);
  }

  @Get('session/:id/status')
  async getSessionStatus(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.checkoutService.getSessionStatus(sessionId, userId);
  }
}
