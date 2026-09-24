import request from 'supertest';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { createHttpFixture } from '../../test/http-fixture';
describe('TestimonialsController : contrats HTTP et droits', () => {
  let fixture: Awaited<ReturnType<typeof createHttpFixture>>;
  const service = {
    findAll: jest.fn().mockResolvedValue([]),
    findByArticle: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
  };
  beforeAll(async () => {
    fixture = await createHttpFixture(
      TestimonialsController,
      TestimonialsService,
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
    await request(fixture.app.getHttpServer()).get('/testimonials').expect(200);
  });
  it('refuse une suppression sans authentification', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/testimonials/p')
      .expect(401);
    expect(service.remove).not.toHaveBeenCalled();
  });
  it('applique les droits du compte utilisateur', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/testimonials/p')
      .set('Authorization', 'Bearer ' + fixture.userToken)
      .expect(200);
    expect(service.remove).toHaveBeenCalledTimes(1);
  });
  it('autorise la suppression par un administrateur', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/testimonials/p')
      .set('Authorization', 'Bearer ' + fixture.adminToken)
      .expect(200);
    expect(service.remove).toHaveBeenCalledTimes(1);
  });
});
