import { ApiProperty } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  @ApiProperty({ example: 'PAID', enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
