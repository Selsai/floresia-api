import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(12, { message: 'Le mot de passe doit contenir au moins 12 caractères.' })
  @Matches(/(?=.*[A-Z])/, { message: 'Le mot de passe doit contenir au moins une majuscule.' })
  @Matches(/(?=.*\d)/, { message: 'Le mot de passe doit contenir au moins un chiffre.' })
  @Matches(/(?=.*[^A-Za-z0-9])/, { message: 'Le mot de passe doit contenir au moins un caractère spécial.' })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}