import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private from = process.env.MAIL_FROM || 'no-reply@floresia.fr';

  async sendVerificationCode(to: string, code: string) {
    await this.resend.emails.send({
      from: `Florésia <${this.from}>`,
      to,
      subject: 'Votre code de vérification Florésia',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #C0478A;">Florésia</h1>
          <p>Voici votre code de vérification :</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #C0478A;">${code}</p>
          <p>Ce code est valable 10 minutes.</p>
          <p style="color: #888; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetLink(to: string, resetUrl: string) {
    await this.resend.emails.send({
      from: `Florésia <${this.from}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe Florésia',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #C0478A;">Florésia</h1>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block; padding: 12px 24px; background: #C0478A; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Ce lien est valable 1 heure.</p>
          <p style="color: #888; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  }
}