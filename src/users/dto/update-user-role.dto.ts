import { ApiProperty } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsEnum } from 'class-validator';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'USER', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
