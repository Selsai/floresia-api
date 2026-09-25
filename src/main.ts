// Rôle : Configuration ou point d’entrée de l’API Florésia.
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // nécessaire pour vérifier la signature du webhook Stripe
  });

  // Webhook Stripe : doit recevoir le corps BRUT (non parsé en JSON)
  // Cette ligne doit être placée AVANT useGlobalPipes / tout parsing JSON
  app.use('/payment/webhook', express.raw({ type: 'application/json' }));

  // Helmet : ajoute des en-têtes HTTP de sécurité
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Servir les images uploadées
  console.log('Dossier uploads servi depuis :', join(process.cwd(), 'uploads'));

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });
  // FRONTEND_URL sert aussi à autoriser le domaine public une fois déployé.
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:5173',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:5173',
  ];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(new URL(process.env.FRONTEND_URL).origin);
  }
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Validation globale des données entrantes (DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Florésia API')
    .setDescription(
      'Documentation de l’API REST de la plateforme e-commerce Florésia',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Entrer un token JWT valide.',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `Serveur démarré sur http://localhost:${process.env.PORT ?? 3000}`,
  );

  console.log(
    `Swagger disponible sur : http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

void bootstrap();
