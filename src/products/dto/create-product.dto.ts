import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProductCategory } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Bouquet exemple' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Exemple de description de la composition florale.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 35 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'https://example.com/images/bouquet.jpg' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: 'ANNIVERSAIRE', enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isCustomizable?: boolean;
}
