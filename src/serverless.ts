import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { Express } from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

let cachedServer: any;

export async function bootstrapServerless(): Promise<any> {
  if (cachedServer) {
    return cachedServer;
  }

  const expressApp: Express = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation con assets CDN para compatibilidad 100% Serverless
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NovaBank Core API — Sistema Bancario Empresarial')
    .setDescription(
      `
# NovaBank Enterprise Core Banking & Ledger API

Plataforma bancaria empresarial documentada con **Swagger / OpenAPI 3.0** y **Base de Datos JSON en memoria**.

### Características:
- ⚖️ **Libro Mayor por Partida Doble**: \`Sum(Débitos) === Sum(Créditos)\`.
- ⚡ **Idempotencia Transaccional**: Cabecera \`Idempotency-Key\`.
- 💱 **Mercado Forex**: Tipos de cambio y conversor.
- 🛡️ **Seguridad (RBAC)**: \`CLIENTE\`, \`CAJERO\`, \`GERENTE\`, \`AUDITOR\`, \`ADMIN\`.
      `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
      },
      'JWT-Auth',
    )
    .addTag('Autenticación y Seguridad')
    .addTag('Cuentas Bancarias')
    .addTag('Transferencias Bancarias')
    .addTag('Operaciones en Ventanilla y Cajero')
    .addTag('Tarjetas Bancarias')
    .addTag('Mercado de Divisas (Forex)')
    .addTag('Auditoría y Cumplimiento')
    .addTag('Usuarios y Clientes')
    .addTag('Monitoreo y Salud del Sistema')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'NovaBank API Docs',
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });

  await app.init();

  cachedServer = serverlessExpress({ app: expressApp });
  return cachedServer;
}
