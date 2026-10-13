import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import {
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFlowerDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSecondary?: boolean;

  @ApiProperty({ example: 'Rose' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Exemple de description de la composition florale.' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'https://example.com/images/bouquet.jpg' })
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: 35 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'Rose' })
  @IsString()
  color: string;
}
