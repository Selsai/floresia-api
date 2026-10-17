// Rôle : Routes HTTP de ce domaine métier.
import {
  Controller,
  BadRequestException,
  HttpCode,
  Logger,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
  Get,
  Param,
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
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('orders/:orderId/confirm')
  confirmOrderPayment(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentService.confirmOrderPayment(orderId, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId/document')
  getOrderDocument(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.paymentService.getOrderDocument(orderId, user.userId);
  }

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
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      this.logger.warn('Webhook Stripe refusé : corps brut indisponible.');
      throw new BadRequestException('Corps brut du webhook indisponible.');
    }
    try {
      return await this.paymentService.handleWebhookEvent(req.rawBody, signature);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Erreur inconnue du webhook.';
      this.logger.warn(
        `Webhook Stripe refusé (signature: ${signature ? 'présente' : 'absente'}, octets: ${req.rawBody.length}) : ${reason}`,
      );
      throw error;
    }
  }
}
