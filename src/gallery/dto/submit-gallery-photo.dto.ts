import { ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsOptional, IsString } from 'class-validator';

export class SubmitGalleryPhotoDto {
  @ApiPropertyOptional({ example: 'Exemple de bouquet partagé' })
  @IsOptional()
  @IsString()
  caption?: string;
  @ApiPropertyOptional({ example: 'compte_exemple' })
  @IsOptional()
  @IsString()
  instagramHandle?: string;
}
