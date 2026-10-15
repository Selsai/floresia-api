// Rôle : Règles métier et accès aux données.
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] || character,
  );

const mailLayout = (
  title: string,
  intro: string,
  content: string,
  footer: string,
) => `
  <!doctype html>
  <html lang="fr">
    <body style="margin:0; padding:0; background:#fbf7f4; color:#3d2530; font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf7f4; padding:28px 12px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; overflow:hidden; border:1px solid #efd8e2; border-radius:24px; background:#ffffff; box-shadow:0 16px 40px rgba(61,37,48,.08);">
            <tr><td align="center" style="padding:26px 28px 22px; background:#fff7fa; border-bottom:1px solid #efd8e2;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;"><tr>
                <td style="padding-right:10px; vertical-align:middle;"><img src="https://floresia.fr/logo-floresia.png" width="50" height="50" alt="" style="display:block; width:50px; height:50px; border:0; object-fit:contain;" /></td>
                <td style="vertical-align:middle; font-family:Georgia,'Times New Roman',serif; color:#b03070; font-size:31px; font-weight:700; line-height:1.2;">Florésia</td>
              </tr></table>
              <div style="margin-top:9px; color:#4f7b43; font-size:11px; font-weight:700; letter-spacing:1.3px; text-transform:uppercase;">Un jardin d’idées, imaginé avec passion</div>
            </td></tr>
            <tr><td align="center" style="padding:34px 30px 30px;">
              <h1 style="margin:0 0 13px; color:#3d2530; font-family:Georgia,'Times New Roman',serif; font-size:27px; line-height:1.25; text-align:center;">${title}</h1>
              <p style="margin:0 auto 25px; max-width:430px; color:#7a5c66; font-size:16px; line-height:1.65; text-align:center;">${intro}</p>
              ${content}
              <p style="margin:27px 0 0; padding-top:20px; border-top:1px solid #efd8e2; color:#8c717a; font-size:13px; line-height:1.55; text-align:center;">${footer}</p>
            </td></tr>
          </table>
          <p style="margin:16px 0 0; color:#9d858d; font-size:12px;">Message automatique envoyé par Florésia.</p>
        </td></tr>
      </table>
    </body>
  </html>`;

@Injectable()
export class MailService {
  async sendAdminNotification(
    id: string,
    title: string,
    payload: Record<string, unknown>,
  ) {
    const recipient = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (recipient !== 'contact.floresia@gmail.com')
      throw new Error('Admin notifications disabled');
    const labels: Record<string, string> = {
      name: 'Compte',
      email: 'Email',
      reference: 'Référence',
      amount: 'Montant TTC (€)',
      content: 'Publication',
      rating: 'Note / 5',
      alias: 'Nom affiché',
    };
    const rows = Object.entries(labels)
      .filter(([key]) => payload[key] != null)
      .map(
        ([key, label]) =>
          `<p style="text-align:left;line-height:1.6"><strong>${label}</strong><br>${escapeHtml(String(payload[key])).replace(/\n/g, '<br>')}</p>`,
      )
      .join('');
    const result = await this.resend.emails.send(
      {
        from: this.sender,
        to: recipient,
        subject: `Florésia : ${title}`,
        html: mailLayout(
          escapeHtml(title),
          'Une nouvelle activité a été enregistrée sur Florésia.',
          rows,
          'Notification de gestion Florésia. Les paiements du site sont en mode test.',
        ),
      },
      { idempotencyKey: `admin/${id}` },
    );
    if (result.error || !result.data?.id)
      throw new Error('Admin email delivery unavailable');
  }
  private resend = new Resend(process.env.RESEND_API_KEY);
  private from = process.env.MAIL_FROM || 'no-reply@floresia.fr';
  private get sender() {
    return this.from.includes('<') ? this.from : `Florésia <${this.from}>`;
  }

  async sendOrderConfirmation(order: {
    id: string;
    totalAmount: number;
    deliveryMethod: string;
    deliveryDate?: Date | null;
    deliveryTime?: string | null;
    user: { email: string; firstName: string };
    address: { street: string; zipCode: string; city: string };
    items: {
      quantity: number;
      unitPrice: number;
      customNote?: string | null;
      product: { name: string };
    }[];
  }) {
    const euros = (amount: number) =>
      amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const rows = order.items
      .map(
        (item) =>
          `<li style="margin-bottom:12px">${item.quantity} × ${escapeHtml(item.product.name)} : ${euros(item.unitPrice * item.quantity)}${item.customNote ? `<br><small>${escapeHtml(item.customNote)}</small>` : ''}</li>`,
      )
      .join('');
    const result = await this.resend.emails.send(
      {
        from: this.sender,
        to: order.user.email,
        subject: 'Florésia : confirmation de votre commande',
        html: mailLayout(
          'Merci pour votre commande',
          `Bonjour ${escapeHtml(order.user.firstName)}, votre paiement a été confirmé.`,
          `<p>Commande ${escapeHtml(order.id)}</p><ul style="text-align:left">${rows}</ul><p><strong>Total TTC : ${euros(order.totalAmount)}</strong></p><p>${order.deliveryMethod === 'PICKUP' ? 'Retrait' : 'Livraison'}${order.deliveryDate ? ` le ${order.deliveryDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}` : ''}${order.deliveryTime ? ` à ${escapeHtml(order.deliveryTime)}` : ''}</p><p>${escapeHtml(order.address.street)}, ${escapeHtml(order.address.zipCode)} ${escapeHtml(order.address.city)}</p>`,
          'Confirmation en mode test. Retrouvez votre commande dans votre espace Florésia.',
        ),
      },
      { idempotencyKey: `order-confirmation/${order.id}` },
    );
    if (result.error || !result.data?.id) {
      const failure = new Error(
        `Envoi de confirmation indisponible (${result.error?.name ?? 'missing_delivery_id'}).`,
      );
      failure.name = 'OrderEmailDeliveryError';
      throw failure;
    }
  }

  async sendVerificationCode(to: string, code: string) {
    // Envoie le code dans le modèle Florésia.
    await this.resend.emails.send({
      from: this.sender,
      to,
      subject: 'Votre code de vérification Florésia',
      html: mailLayout(
        'Vérifiez votre adresse email',
        'Saisissez ce code dans Florésia pour terminer la vérification de votre compte.',
        `<div style="margin:0 auto; padding:20px 12px; border:1px solid #f0cbdc; border-radius:16px; background:#fff7fa; color:#b03070; font-size:32px; font-weight:800; letter-spacing:8px; text-align:center;">${escapeHtml(code)}</div>
         <p style="margin:18px 0 0; color:#5c8a4e; font-size:14px; font-weight:700; text-align:center;">Ce code est valable pendant 10 minutes.</p>`,
        'Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.',
      ),
    });
  }

  async sendAccountDeletion(
    to: string,
    firstName: string,
    url: string,
    deadline: Date,
  ) {
    const date = deadline.toLocaleDateString('fr-FR', {
      timeZone: 'Europe/Paris',
    });
    const safeUrl = escapeHtml(url);
    const result = await this.resend.emails.send({
      from: this.sender,
      to,
      subject: 'Florésia : demande de suppression de votre compte',
      html: mailLayout(
        'Votre compte a été désactivé',
        `Bonjour ${escapeHtml(firstName)}, vous avez demandé la suppression de votre compte.`,
        `<p style="line-height:1.7">Nous vous conseillons de télécharger les factures de vos commandes. Vous disposez de 30 jours, jusqu’au ${date}, pour le faire depuis cet espace sécurisé.</p><p><a href="${safeUrl}" style="color:#b03070">Télécharger mes factures</a></p><p style="line-height:1.7">Si vous n’êtes pas à l’origine de cette demande, cliquez sur le bouton ci-dessous. Vous devrez choisir un nouveau mot de passe pour réactiver votre compte.</p><p><a href="${safeUrl}" style="display:inline-block;background:#b03070;color:white;padding:14px 22px;border-radius:24px;text-decoration:none">Réactiver mon compte</a></p>`,
        'Après 30 jours, la réactivation ne sera plus possible et vos données de profil seront effacées. Les documents nécessaires au suivi des commandes et aux obligations comptables peuvent être conservés. Ce lien est personnel : ne le partagez pas.',
      ),
    });
    if (result.error || !result.data?.id)
      throw new ServiceUnavailableException(
        'L’email de sécurité n’a pas pu être envoyé. Votre compte reste actif.',
      );
  }

  async sendPasswordResetLink(to: string, resetUrl: string) {
    // Envoie le lien de réinitialisation sécurisé.
    await this.resend.emails.send({
      from: this.sender,
      to,
      subject: 'Réinitialisation de votre mot de passe Florésia',
      html: mailLayout(
        'Réinitialisez votre mot de passe',
        'Vous avez demandé à choisir un nouveau mot de passe pour votre compte Florésia.',
        `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;"><tr><td align="center" bgcolor="#c0478a" style="border-radius:999px;">
           <a href="${escapeHtml(resetUrl)}" style="display:inline-block; padding:14px 25px; border:1px solid #c0478a; border-radius:999px; background:#c0478a; color:#ffffff; font-size:15px; font-weight:700; line-height:1.2; text-decoration:none;">Réinitialiser mon mot de passe</a>
         </td></tr></table>
         <p style="margin:18px 0 0; color:#5c8a4e; font-size:14px; font-weight:700; text-align:center;">Ce lien est valable pendant 1 heure.</p>`,
        'Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : votre mot de passe restera inchangé.',
      ),
    });
  }
}
