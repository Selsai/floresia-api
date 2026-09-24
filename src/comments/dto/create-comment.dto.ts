import { IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString() content: string;
  @IsString() articleId: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsString() taggedUserId?: string;
}
