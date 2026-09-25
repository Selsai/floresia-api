// Rôle : Validation des données reçues par l’API.
import { IsOptional, IsString } from 'class-validator';

export class SubmitGalleryPhotoDto {
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsString() instagramHandle?: string;
}
