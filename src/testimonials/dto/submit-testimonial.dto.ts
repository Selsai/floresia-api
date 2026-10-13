import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitTestimonialDto {
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
