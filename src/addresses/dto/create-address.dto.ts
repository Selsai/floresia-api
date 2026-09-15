import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  label: string;

  @IsString()
  fullName: string;

  @IsString()
  street: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  city: string;

  @IsString()
  @Matches(/^750(0[1-9]|1[0-9]|20)$/, {
    message:
      'Florésia ne livre actuellement que dans Paris intramuros (codes postaux 75001 à 75020).',
  })
  zipCode: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @Matches(/^(?:(?:\+33|0)[1-9](?:[ .-]?\d{2}){4})$/, {
    message:
      'Le numéro de téléphone doit être un numéro français valide (ex: 06 12 34 56 78).',
  })
  phone: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;
}