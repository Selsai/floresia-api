import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';
import { PaymentService } from '../payment/payment.service';

describe('Accès limité aux factures après désactivation', () => {
  it('résout le propriétaire depuis le lien et délègue le contrôle de propriété au service de paiement', async () => {
    const deletion = {
      verifyAccess: jest.fn().mockResolvedValue({ id: 'owner' }),
    };
    const payment = {
      getOrderDocument: jest
        .fn()
        .mockResolvedValue({ url: 'https://invoice.stripe.com/example' }),
    };
    const controller = new AccountDeletionController(
      deletion as unknown as AccountDeletionService,
      payment as unknown as PaymentService,
    );
    await controller.document({ token: 'a'.repeat(64), orderId: 'order' });
    expect(payment.getOrderDocument).toHaveBeenCalledWith('order', 'owner');
  });
  it('ne consulte aucune facture si le lien est invalide', async () => {
    const deletion = {
      verifyAccess: jest.fn().mockRejectedValue(new Error('Expired')),
    };
    const payment = { getOrderDocument: jest.fn() };
    const controller = new AccountDeletionController(
      deletion as unknown as AccountDeletionService,
      payment as unknown as PaymentService,
    );
    await expect(
      controller.document({ token: 'a'.repeat(64), orderId: 'order' }),
    ).rejects.toThrow('Expired');
    expect(payment.getOrderDocument).not.toHaveBeenCalled();
  });
});
