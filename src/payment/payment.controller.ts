import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

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
  createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    return this.paymentService.createCheckoutSession(dto.orderId);
  }

@Post('webhook')
handleWebhook(
  @Req() req: Request,
  @Headers('stripe-signature') signature: string,
) {
  return this.paymentService.handleWebhookEvent(req.body, signature);
}

}