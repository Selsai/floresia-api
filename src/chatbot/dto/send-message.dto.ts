import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type, type TransformFnParams } from 'class-transformer';

class HistoryItemDto {
  @ApiProperty({ example: 'user', enum: ['user', 'model'], type: String })
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty({ example: 'Je souhaite offrir un bouquet.' })
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Quel bouquet offrir pour un anniversaire ?' })
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Le message ne peut pas être vide.' })
  @MaxLength(500)
  message: string;

  @ApiPropertyOptional({
    example: [
      { role: 'user', content: 'Quel bouquet offrir pour un anniversaire ?' },
    ],
    type: () => [HistoryItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryItemDto)
  history?: HistoryItemDto[];
}
