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

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NovaBank Core API — Sistema Bancario Empresarial')
    .setDescription('Plataforma bancaria empresarial serverless documentada con Swagger/OpenAPI.')
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
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.init();

  cachedServer = serverlessExpress({ app: expressApp });
  return cachedServer;
}
