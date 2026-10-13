import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ example: 'Exemple de conseil floral' })
  @IsString()
  title: string;
  @ApiProperty({ example: 'Exemple de présentation d’un article.' })
  @IsString()
  excerpt: string;
  @ApiProperty({ example: 'Exemple de texte à adapter.' })
  @IsString()
  content: string;
  @ApiPropertyOptional({ example: 'https://example.com/images/bouquet.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
  @ApiProperty({ example: 'Conseils' })
  @IsString()
  category: string;
  @ApiProperty({ example: '3 min' })
  @IsString()
  readTime: string;
  @ApiProperty({ example: 'Exemple Utilisateur' })
  @IsString()
  displayAuthorName: string;
  @ApiPropertyOptional({ example: 'Exemple de présentation de l’auteur.' })
  @IsOptional()
  @IsString()
  displayAuthorBio?: string;

  // Optionnel : uniquement pour le seed, permet de préserver une date de
  // publication d'origine au lieu de la date réelle d'insertion en base.
  @ApiPropertyOptional({ example: '2026-10-13T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
