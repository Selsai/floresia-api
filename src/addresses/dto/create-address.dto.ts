import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsIn,
  IsNotEmpty,
  MaxLength,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'DELIVERY', enum: ['DELIVERY', 'BILLING'] })
  @IsOptional()
  @IsIn(['DELIVERY', 'BILLING'])
  purpose?: string;
  @ApiPropertyOptional({ example: 'Domicile' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: 'Exemple Utilisateur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: '1 rue Exemple' })
  @IsString()
  street: string;

  @ApiPropertyOptional({ example: 'Bâtiment A, étage 2' })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({ example: 'Paris' })
  @IsString()
  city: string;

  @ApiProperty({ example: '75001' })
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Le code postal doit contenir 5 chiffres.' })
  zipCode: string;

  @ApiPropertyOptional({ example: 'France' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    example: '0612345678',
    description:
      'Obligatoire pour une adresse de livraison, facultatif pour la facturation.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?:(?:\+33|0)[1-9](?:[ .-]?\d{2}){4})$/, {
    message:
      'Le numéro de téléphone doit être un numéro français valide (ex: 06 12 34 56 78).',
  })
  phone?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 48.86 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ example: 2.34 })
  @IsNumber()
  @IsOptional()
  lng?: number;
}
