// Rôle : Tests automatisés de cette fonctionnalité.
import request from 'supertest';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { createHttpFixture } from '../../test/http-fixture';
describe('ArticlesController : contrats HTTP et droits', () => {
  let fixture: Awaited<ReturnType<typeof createHttpFixture>>;
  const service = {
    findAll: jest.fn().mockResolvedValue([]),
    findByArticle: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
  };
  beforeAll(async () => {
    fixture = await createHttpFixture(
      ArticlesController,
      ArticlesService,
      service,
    );
  });
  afterAll(async () => {
    await fixture.app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('rend la consultation publique accessible', async () => {
    await request(fixture.app.getHttpServer()).get('/articles').expect(200);
  });
  it('refuse une suppression sans authentification', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/articles/p')
      .expect(401);
    expect(service.remove).not.toHaveBeenCalled();
  });
  it('applique les droits du compte utilisateur', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/articles/p')
      .set('Authorization', 'Bearer ' + fixture.userToken)
      .expect(403);
    expect(service.remove).not.toHaveBeenCalled();
  });
  it('autorise la suppression par un administrateur', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/articles/p')
      .set('Authorization', 'Bearer ' + fixture.adminToken)
      .expect(200);
    expect(service.remove).toHaveBeenCalledTimes(1);
  });
});
