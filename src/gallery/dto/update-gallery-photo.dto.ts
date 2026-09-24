import { PartialType } from '@nestjs/mapped-types';
import { CreateGalleryPhotoDto } from './create-gallery-photo.dto';

export class UpdateGalleryPhotoDto extends PartialType(CreateGalleryPhotoDto) {}
