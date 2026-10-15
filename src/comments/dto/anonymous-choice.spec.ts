import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

describe('Choix d’anonymat multipart', () => {
  it.each([
    ['true', true],
    ['false', false],
    [true, true],
    [false, false],
  ])('interprète exactement %p', async (input, expected) => {
    const dto = plainToInstance(CreateCommentDto, {
      articleId: 'a',
      content: 'Exemple',
      isAnonymous: input,
    });
    expect(dto.isAnonymous).toBe(expected);
    expect(await validate(dto)).toHaveLength(0);
  });
  it('rejette une valeur ambiguë', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      articleId: 'a',
      content: 'Exemple',
      isAnonymous: 'oui',
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
