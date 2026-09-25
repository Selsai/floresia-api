// Rôle : Validation des données reçues par l’API.
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateGalleryPhotoDto {
  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
