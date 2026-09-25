// Rôle : Tests automatisés de cette fonctionnalité.
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
describe('JwtStrategy : configuration et identité', () => {
  it('refuse de démarrer sans secret JWT configuré', () => {
    const config = {
      getOrThrow: jest.fn(() => {
        throw new Error('Missing JWT_SECRET');
      }),
    };
    expect(() => new JwtStrategy(config as unknown as ConfigService)).toThrow(
      'Missing JWT_SECRET',
    );
  });
  it('extrait les seuls champs nécessaires du JWT', () => {
    const config = { getOrThrow: jest.fn().mockReturnValue('test-secret') };
    const strategy = new JwtStrategy(config as unknown as ConfigService);
    expect(
      strategy.validate({
        sub: 'u',
        email: 'flora@example.test',
        role: 'USER',
      }),
    ).toEqual({ userId: 'u', email: 'flora@example.test', role: 'USER' });
    expect(config.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
  });
});
