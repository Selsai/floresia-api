import {
  Body,
  Controller,
 Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ==========================
  // Toutes les commandes
  // ==========================

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  // ==========================
  // Une commande
  // ==========================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // ==========================
  // Créer une commande
  // ==========================

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user.sub, dto);
  }

  // ==========================
  // Modifier une commande
  // ==========================

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, dto);
  }

  // ==========================
  // Supprimer une commande
  // ==========================

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}