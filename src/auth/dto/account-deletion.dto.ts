import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({ example: 'ExempleMotDePasse!12' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}

export class DeletionTokenDto {
  @ApiProperty({
    example: 'a'.repeat(64),
    description: 'Jeton reçu par email, valable pendant 30 jours.',
  })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  token: string;
}

export class DeletionDocumentDto extends DeletionTokenDto {
  @ApiProperty({ example: 'commande-exemple' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  orderId: string;
}
