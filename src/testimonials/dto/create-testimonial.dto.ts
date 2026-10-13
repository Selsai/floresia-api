import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Exemple Utilisateur' })
  @IsString()
  authorName: string;
  @ApiProperty({ example: 'Exemple de texte à adapter.' })
  @IsString()
  content: string;
  @ApiPropertyOptional({ example: 'https://example.com/images/bouquet.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
  @ApiPropertyOptional({ example: 'Anniversaire' })
  @IsOptional()
  @IsString()
  occasion?: string;
}
