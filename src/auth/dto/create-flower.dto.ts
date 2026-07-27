import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFlowerDto {
  @IsString()
  name: string;

  @IsString()
  color: string;

  @IsString()
  imageUrl: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;
}