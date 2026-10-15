import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// Rôle : Validation des données reçues par l’API.
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Afficher un nom floral à la place de votre identité.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isAnonymous?: boolean;
  @ApiProperty({ example: 'Exemple de texte à adapter.' })
  @IsString()
  content: string;
  @ApiProperty({
    example: 'id-article-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsString()
  articleId: string;
  @ApiPropertyOptional({
    example: 'id-commentaire-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
  @ApiPropertyOptional({
    example: 'id-utilisateur-exemple',
    description:
      'Valeur fictive à remplacer par celle de votre parcours de test.',
  })
  @IsOptional()
  @IsString()
  taggedUserId?: string;
}
