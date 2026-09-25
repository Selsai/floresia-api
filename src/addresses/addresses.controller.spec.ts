// Rôle : Tests automatisés de cette fonctionnalité.
import request from 'supertest';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { createHttpFixture } from '../../test/http-fixture';
describe('AddressesController : contrats HTTP et droits', () => {
  let fixture: Awaited<ReturnType<typeof createHttpFixture>>;
  const service = {
    findAll: jest.fn().mockResolvedValue([]),
    findByArticle: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue({ message: 'deleted' }),
  };
  beforeAll(async () => {
    fixture = await createHttpFixture(
      AddressesController,
      AddressesService,
      service,
    );
  });
  afterAll(async () => {
    await fixture.app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuse une suppression sans authentification', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/addresses/p')
      .expect(401);
    expect(service.remove).not.toHaveBeenCalled();
  });
  it('applique les droits du compte utilisateur', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/addresses/p')
      .set('Authorization', 'Bearer ' + fixture.userToken)
      .expect(200);
    expect(service.remove).toHaveBeenCalledTimes(1);
  });
  it('autorise la suppression par un administrateur', async () => {
    await request(fixture.app.getHttpServer())
      .delete('/addresses/p')
      .set('Authorization', 'Bearer ' + fixture.adminToken)
      .expect(200);
    expect(service.remove).toHaveBeenCalledTimes(1);
  });
});
