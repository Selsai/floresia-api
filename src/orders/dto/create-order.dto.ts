// Rôle : Validation des données reçues par l’API.
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class BouquetFlowerDto {
  @IsString() @IsNotEmpty() flowerId: string;
  @IsInt() @Min(1) @Max(1000) quantity: number;
}

export class CustomBouquetDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BouquetFlowerDto)
  flowers: BouquetFlowerDto[];

  @IsOptional() @IsString() @MaxLength(100) occasionName?: string;
  @IsOptional() @IsString() @MaxLength(50) ribbonColor?: string;
  @IsOptional() @IsString() @MaxLength(500) message?: string;
}

export class OrderItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsInt() @Min(1) @Max(100) quantity: number;

  // Compatibilité avec les anciens clients ; le serveur ignore ce prix.
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsString() @MaxLength(2000) customNote?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomBouquetDto)
  customBouquet?: CustomBouquetDto;
}

export class CreateOrderDto {
  @IsString() @IsNotEmpty() addressId: string;

  // Le total est recalculé par le serveur, jamais accepté comme référence.
  @IsOptional() @IsNumber() @Min(0) totalAmount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsIn(['DELIVERY', 'PICKUP'])
  deliveryMethod?: 'DELIVERY' | 'PICKUP';

  @IsOptional() @IsString() @IsNotEmpty() pickupStoreId?: string;
}
