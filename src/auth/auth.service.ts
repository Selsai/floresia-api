import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const code = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationCode: code, verificationCodeExpires: expires },
    });

    await this.mailService.sendVerificationCode(email, code);

    return {
      message: 'Compte créé avec succès.',
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Connexion réussie.',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé.');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const email = dto.email.toLowerCase().trim();

      const existing = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existing && existing.id !== userId) {
        throw new BadRequestException(
          'Cet email est déjà utilisé par un autre compte.',
        );
      }

      dto.email = email;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        isEmailVerified: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'Les deux mots de passe ne correspondent pas.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé.');
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    const isSameAsOld = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );

    if (isSameAsOld) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l’ancien.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Mot de passe modifié avec succès.' };
  }

  // ==========================
  // Vérification d'email
  // ==========================

  async sendVerificationCode(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException(
        'Aucun compte associé à cet email.',
      );
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(
        'Cet email est déjà vérifié.',
      );
    }

    const code = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeExpires: expires,
      },
    });

    await this.mailService.sendVerificationCode(
      normalizedEmail,
      code,
    );

    return { message: 'Code envoyé.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Compte introuvable.');
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      throw new BadRequestException(
        'Aucun code en attente. Demandez-en un nouveau.',
      );
    }

    if (user.verificationCodeExpires < new Date()) {
      throw new BadRequestException(
        'Ce code a expiré. Demandez-en un nouveau.',
      );
    }

    if (user.verificationCode !== dto.code) {
      throw new BadRequestException('Code incorrect.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    return { message: 'Email vérifié avec succès.' };
  }

  // ==========================
  // Mot de passe oublié
  // ==========================

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Réponse identique que le compte existe ou non
    // (anti-énumération de comptes)
    if (!user) {
      return {
        message:
          'Si un compte existe avec cet email, un lien a été envoyé.',
      };
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    // FRONTEND_URL doit contenir le base path :
    // http://localhost:5173/floresia-app
    const resetLink = `${process.env.FRONTEND_URL}/reinitialiser-mot-de-passe?token=${token}`;

    console.log(
      `[DEV] Lien de réinitialisation pour ${normalizedEmail} : ${resetLink}`,
    );

    await this.mailService.sendPasswordResetLink(
      normalizedEmail,
      resetLink,
    );

    return {
      message:
        'Si un compte existe avec cet email, un lien a été envoyé.',
      devToken: token,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Lien invalide ou expiré.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return {
      message: 'Mot de passe réinitialisé avec succès.',
    };
  }
}