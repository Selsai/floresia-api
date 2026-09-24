import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateArticleDto {
  @IsString() title: string;
  @IsString() excerpt: string;
  @IsString() content: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsString() category: string;
  @IsString() readTime: string;
  @IsString() displayAuthorName: string;
  @IsOptional() @IsString() displayAuthorBio?: string;

  // Optionnel : uniquement pour le seed, permet de préserver une date de
  // publication d'origine au lieu de la date réelle d'insertion en base.
  @IsOptional() @IsDateString() createdAt?: string;
}
