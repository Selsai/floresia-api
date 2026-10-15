import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SubmitTestimonialDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Publier sous un nom floral anonyme.',
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
  @ApiProperty({ example: 'Exemple de texte à adapter.' })
  @IsString()
  content: string;
  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
  @ApiPropertyOptional({ example: 'Anniversaire' })
  @IsOptional()
  @IsString()
  occasion?: string;
}
