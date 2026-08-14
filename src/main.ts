import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('NovaBankBootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';

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

  app.setGlobalPrefix(apiPrefix);

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NovaBank Core API — Sistema Bancario Empresarial')
    .setDescription(
      `
# NovaBank Enterprise Core Banking & Ledger API

Plataforma de servicios financieros corporativos diseñada con **Clean Architecture** y **Domain-Driven Design (DDD)**.

### Características Principales:
- ⚖️ **Libro Mayor por Partida Doble (General Ledger)**: Cada movimiento genera débitos y créditos estrictamente balanceados (\`Sum(Débitos) === Sum(Créditos)\`).
- ⚡ **Idempotencia Transaccional**: Cabecera \`Idempotency-Key\` para reintentos seguros sin duplicación de cobros ni transferencias.
- 💱 **Mercado Forex y Caché Redis**: Consulta de cotizaciones mundiales con estrategia *Cache-Aside* de alta velocidad.
- 🛡️ **Seguridad Bancaria (RBAC)**: Roles \`CLIENTE\`, \`CAJERO\`, \`GERENTE\`, \`AUDITOR\` y \`ADMIN\`.
- ☁️ **Soporte Serverless Netlify & Docker**: Base de datos JSON in-memory autocontenida.
      `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Introduce tu token JWT (obtenido desde /api/v1/auth/login)',
        in: 'header',
      },
      'JWT-Auth',
    )
    .addTag('Autenticación y Seguridad', 'Registro, inicio de sesión y gestión de tokens JWT')
    .addTag('Cuentas Bancarias', 'Apertura de cuentas, validación de IBANs y extractos contables')
    .addTag('Transferencias Bancarias', 'Transferencias atómicas entre cuentas con control de idempotencia')
    .addTag('Operaciones en Ventanilla y Cajero', 'Depósitos y retiros en efectivo (Rol Cajero / Admin)')
    .addTag('Tarjetas Bancarias', 'Emisión, enmascaramiento seguro, congelación y límites')
    .addTag('Mercado de Divisas (Forex)', 'Tipos de cambio mundiales cacheados en Redis y conversor')
    .addTag('Auditoría y Cumplimiento', 'Pistas de auditoría inmutables (Audit Trail)')
    .addTag('Usuarios y Clientes', 'Gestión de perfiles de clientes y estados')
    .addTag('Monitoreo y Salud del Sistema', 'Healthchecks de base de datos JSON, Redis y memoria')
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
      filter: true,
    },
  });

  await app.listen(port);
  logger.log(`Servidor NovaBank Core API ejecutándose en http://localhost:${port}/${apiPrefix}`);
  logger.log(`Documentación Swagger UI disponible en http://localhost:${port}/docs`);
}

bootstrap();