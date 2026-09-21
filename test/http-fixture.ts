import { INestApplication, Type, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { App } from 'supertest/types';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { RolesGuard } from '../src/auth/roles/roles.guard';
import { PrismaService } from '../src/prisma/prisma.service';

// Identités fictives signées localement ; aucun compte ni service externe.
export async function createHttpFixture(controller: Type<unknown>, serviceType: Type<unknown>, service: object) {
  const secret = 'test-only-secret-not-used-by-floresia';
  const module = await Test.createTestingModule({
    imports: [JwtModule.register({ secret })],
    controllers: [controller],
    providers: [
      { provide: serviceType, useValue: service },
      { provide: ConfigService, useValue: { get: () => secret, getOrThrow: () => secret } },
      { provide: PrismaService, useValue: { user: { findUnique: jest.fn().mockResolvedValue({ isEmailVerified: true }) } } },
      JwtStrategy, RolesGuard,
    ],
  }).compile();
  const app: INestApplication<App> = module.createNestApplication({ rawBody: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();
  const jwt = module.get(JwtService);
  return {
    app,
    userToken: jwt.sign({ sub: 'user-test', email: 'flora@example.test', role: 'USER' }),
    adminToken: jwt.sign({ sub: 'admin-test', email: 'admin@example.test', role: 'ADMIN' }),
  };
}