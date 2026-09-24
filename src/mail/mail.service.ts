import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character] || character);

const mailLayout = (title: string, intro: string, content: string, footer: string) => `
  <!doctype html>
  <html lang="fr">
    <body style="margin:0; padding:0; background:#fbf7f4; color:#3d2530; font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf7f4; padding:28px 12px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; overflow:hidden; border:1px solid #efd8e2; border-radius:24px; background:#ffffff; box-shadow:0 16px 40px rgba(61,37,48,.08);">
            <tr><td align="center" style="padding:28px 28px 24px; background:linear-gradient(135deg,#fff8fa,#f8eaf0); border-bottom:1px solid #efd8e2;">
              <img src="https://floresia.fr/logo-floresia.png" width="66" height="66" alt="Logo Florésia" style="display:block; width:66px; height:66px; margin:0 auto 10px; object-fit:contain;" />
              <div style="font-family:Georgia,'Times New Roman',serif; color:#b03070; font-size:30px; font-weight:700; line-height:1.2;">Florésia</div>
              <div style="margin-top:6px; color:#5c8a4e; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">Un jardin d’idées, imaginé avec passion</div>
            </td></tr>
            <tr><td style="padding:32px 30px;">
              <h1 style="margin:0 0 12px; color:#3d2530; font-family:Georgia,'Times New Roman',serif; font-size:27px; line-height:1.25;">${title}</h1>
              <p style="margin:0 0 24px; color:#7a5c66; font-size:16px; line-height:1.65;">${intro}</p>
              ${content}
              <p style="margin:26px 0 0; padding-top:20px; border-top:1px solid #efd8e2; color:#8c717a; font-size:13px; line-height:1.55;">${footer}</p>
            </td></tr>
          </table>
          <p style="margin:16px 0 0; color:#9d858d; font-size:12px;">Message automatique envoyé par Florésia.</p>
        </td></tr>
      </table>
    </body>
  </html>`;

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private from = process.env.MAIL_FROM || 'no-reply@floresia.fr';

  async sendVerificationCode(to: string, code: string) {
    await this.resend.emails.send({
      from: `Florésia <${this.from}>`,
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

  async sendPasswordResetLink(to: string, resetUrl: string) {
    await this.resend.emails.send({
      from: `Florésia <${this.from}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe Florésia',
      html: mailLayout(
        'Réinitialisez votre mot de passe',
        'Vous avez demandé à choisir un nouveau mot de passe pour votre compte Florésia.',
        `<p style="margin:0; text-align:center;">
           <a href="${escapeHtml(resetUrl)}" style="display:inline-block; padding:14px 24px; border-radius:999px; background:#c0478a; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none;">Réinitialiser mon mot de passe</a>
         </p>
         <p style="margin:18px 0 0; color:#5c8a4e; font-size:14px; font-weight:700; text-align:center;">Ce lien est valable pendant 1 heure.</p>`,
        'Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : votre mot de passe restera inchangé.',
      ),
    });
  }
}
