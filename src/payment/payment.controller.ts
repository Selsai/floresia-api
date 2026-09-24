import {
  Controller,
  BadRequestException,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @ApiBody({ type: CreateCheckoutSessionDto })
  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentService.createCheckoutSession(dto.orderId, user.userId);
  }

  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Corps brut du webhook indisponible.');
    }
    return this.paymentService.handleWebhookEvent(req.rawBody, signature);
  }
}
