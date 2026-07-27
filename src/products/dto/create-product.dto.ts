import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProductCategory } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsString()
  imageUrl: string;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsBoolean()
  @IsOptional()
  isCustomizable?: boolean;
}