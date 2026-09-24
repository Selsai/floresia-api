import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { createHttpFixture } from '../../test/http-fixture';
describe('AuthController : validation HTTP et profil', () => {
  let fixture: Awaited<ReturnType<typeof createHttpFixture>>;
  const service = {
    register: jest.fn().mockResolvedValue({ message: 'created' }),
    login: jest.fn().mockResolvedValue({ token: 'jwt' }),
    getProfile: jest.fn().mockResolvedValue({ id: 'user-test' }),
  };
  beforeAll(async () => {
    fixture = await createHttpFixture(AuthController, AuthService, service);
  });
  afterAll(async () => {
    await fixture.app.close();
  });
  beforeEach(() => jest.clearAllMocks());
  it.each([
    {
      email: 'invalid',
      password: 'long-password',
      firstName: 'Flora',
      lastName: 'Test',
    },
    {
      email: 'flora@example.test',
      password: 'short',
      firstName: 'Flora',
      lastName: 'Test',
    },
    {
      email: 'flora@example.test',
      password: 'long-password',
      firstName: 'Flora',
      lastName: 'Test',
      role: 'ADMIN',
    },
  ])(
    'refuse une inscription invalide ou une injection de rôle',
    async (data) => {
      await request(fixture.app.getHttpServer())
        .post('/auth/register')
        .send(data)
        .expect(400);
      expect(service.register).not.toHaveBeenCalled();
    },
  );
  it('accepte une inscription valide sans champ supplémentaire', async () => {
    await request(fixture.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'flora@example.test',
        password: 'long-password',
        firstName: 'Flora',
        lastName: 'Test',
      })
      .expect(201);
    expect(service.register).toHaveBeenCalledTimes(1);
  });
  it('refuse la consultation du profil sans JWT', async () => {
    await request(fixture.app.getHttpServer()).get('/auth/me').expect(401);
    expect(service.getProfile).not.toHaveBeenCalled();
  });
  it('utilise l’identité signée pour consulter le profil', async () => {
    await request(fixture.app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer ' + fixture.userToken)
      .expect(200);
    expect(service.getProfile).toHaveBeenCalledWith('user-test');
  });
  it('refuse un JWT falsifié', async () => {
    await request(fixture.app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer false-token')
      .expect(401);
    expect(service.getProfile).not.toHaveBeenCalled();
  });
});
