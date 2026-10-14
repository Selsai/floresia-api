import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class CartCommandDto {
  @ApiProperty({ example: '00000000-0000-4000-8000-000000000001' })
  @IsUUID('4')
  commandId: string;
  @ApiProperty({
    example: 'add',
    enum: ['add', 'remove', 'quantity', 'clear', 'settle', 'merge'],
  })
  @IsIn(['add', 'remove', 'quantity', 'clear', 'settle', 'merge'])
  operation: string;
  @ApiPropertyOptional({ example: 'id-produit-exemple' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id?: string;
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  quantity?: number;
  @ApiPropertyOptional({ example: { id: 'id-produit-exemple' } })
  @IsOptional()
  @IsObject()
  item?: Record<string, unknown>;
  @ApiPropertyOptional({ example: [{ id: 'id-produit-exemple', quantity: 1 }] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  items?: Record<string, unknown>[];
}
