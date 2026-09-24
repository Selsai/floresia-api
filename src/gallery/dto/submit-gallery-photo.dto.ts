import { IsOptional, IsString } from 'class-validator';

export class SubmitGalleryPhotoDto {
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsString() instagramHandle?: string;
}
