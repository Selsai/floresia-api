import {
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateFlowerDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  imageUrl: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  color: string;
}