import { ValidationPipe } from '@nestjs/common';
import { UpdateFlowerDto } from './update-flower.dto';

describe('Classification des fleurs : validation HTTP', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  const metadata = { type: 'body' as const, metatype: UpdateFlowerDto };

  it.each([true, false])('accepte isSecondary=%s dans un PATCH partiel', async value => {
    await expect(pipe.transform({ isSecondary: value }, metadata))
      .resolves.toMatchObject({ isSecondary: value });
  });

  it('refuse une chaîne à la place du booléen', async () => {
    await expect(pipe.transform({ isSecondary: 'true' }, metadata)).rejects.toThrow();
  });

  it('continue de refuser les propriétés inconnues', async () => {
    await expect(pipe.transform({ unexpected: true }, metadata)).rejects.toThrow();
  });
});
