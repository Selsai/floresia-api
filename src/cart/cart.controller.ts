import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { CartCommandDto } from './cart.dto';
@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}
  @Get() get(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.get(user.userId);
  }
  @Post() mutate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() command: CartCommandDto,
  ) {
    return this.cart.mutate(user.userId, command);
  }
}
