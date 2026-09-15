import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  customNote?: string;
}

export class CreateOrderDto {
  @IsString()
  addressId: string;

  @IsNumber()
  totalAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Méthode de livraison / retrait
  @IsEnum(['DELIVERY', 'PICKUP'])
  @IsOptional()
  deliveryMethod?: 'DELIVERY' | 'PICKUP';

  @IsString()
  @IsOptional()
  pickupStoreId?: string;
}