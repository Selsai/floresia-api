import { ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Domicile' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 'Exemple Utilisateur' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '1 rue Exemple' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ example: 'Bâtiment A, étage 2' })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({ example: 'Paris' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '75001' })
  @IsString()
  @IsOptional()
  @Matches(/^750(0[1-9]|1[0-9]|20)$/, {
    message:
      'Florésia ne livre actuellement que dans Paris intramuros (codes postaux 75001 à 75020).',
  })
  zipCode?: string;

  @ApiPropertyOptional({ example: 'France' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '0612345678' })
  @IsString()
  @IsOptional()
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
