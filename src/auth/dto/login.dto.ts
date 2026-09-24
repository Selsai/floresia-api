import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'selsabil@gmail.com',
    description: 'Email du compte utilisateur',
  })
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Mot de passe utilisateur',
  })
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  password: string;
}
