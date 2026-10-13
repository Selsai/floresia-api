import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateGalleryPhotoDto {
  @ApiProperty({ example: 'https://example.com/images/bouquet.jpg' })
  @IsUrl()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'Exemple de bouquet partagé' })
  @IsOptional()
  @IsString()
  caption?: string;
}
