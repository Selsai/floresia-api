import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class BouquetFlowerDto {
  @ApiProperty({
    example: 'id-fleur-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsString()
  @IsNotEmpty()
  flowerId: string;
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(1000)
  quantity: number;
}

export class CustomBouquetDto {
  @ApiProperty({
    example: [{ flowerId: 'id-fleur-exemple', quantity: 3 }],
    type: () => [BouquetFlowerDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BouquetFlowerDto)
  flowers: BouquetFlowerDto[];

  @ApiPropertyOptional({ example: 'Anniversaire' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occasionName?: string;
  @ApiPropertyOptional({ example: 'pink' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ribbonColor?: string;
  @ApiPropertyOptional({ example: 'Joyeux anniversaire !' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class OrderItemDto {
  @ApiProperty({
    example: 'id-produit-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  // Compatibilité avec les anciens clients ; le serveur ignore ce prix.
  @ApiPropertyOptional({
    example: 0,
    description:
      'Champ de compatibilité facultatif. Le montant officiel est recalculé par le serveur.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
  @ApiPropertyOptional({ example: 'Exemple de personnalisation' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customNote?: string;

  @ApiPropertyOptional({
    example: {
      flowers: [{ flowerId: 'id-fleur-exemple', quantity: 3 }],
      occasionName: 'Anniversaire',
      ribbonColor: 'pink',
      message: 'Joyeux anniversaire !',
    },
    type: () => CustomBouquetDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomBouquetDto)
  customBouquet?: CustomBouquetDto;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'id-adresse-facturation-exemple' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  billingAddressId?: string;
  @ApiPropertyOptional({
    example: '10:30',
    description: 'Heure souhaitée à Paris, au format HH:mm.',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Indiquez une heure valide au format HH:mm.',
  })
  deliveryTime?: string;
  @ApiPropertyOptional({
    example: '2026-10-20T12:00:00.000Z',
    description:
      'Date illustrative à adapter : en semaine, au moins deux jours ouvrés après la commande.',
  })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;
  @ApiProperty({
    example: 'id-adresse-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  // Le total est recalculé par le serveur, jamais accepté comme référence.
  @ApiPropertyOptional({
    example: 0,
    description:
      'Champ de compatibilité facultatif. Le montant officiel est recalculé par le serveur.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @ApiProperty({
    example: [{ productId: 'id-produit-exemple', quantity: 1 }],
    type: () => [OrderItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({
    example: 'DELIVERY',
    enum: ['DELIVERY', 'PICKUP'],
    type: String,
  })
  @IsOptional()
  @IsIn(['DELIVERY', 'PICKUP'])
  deliveryMethod?: 'DELIVERY' | 'PICKUP';

  @ApiPropertyOptional({
    example: 'id-point-retrait-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pickupStoreId?: string;
}
