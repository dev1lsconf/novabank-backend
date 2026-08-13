# 🏛️ NovaBank Core API — Sistema Bancario Empresarial

> **API RESTful de Microservicios y Core Bancario Documentada**  
> Diseñada bajo principios de **Clean Architecture**, **Domain-Driven Design (DDD)** y **Contabilidad por Partida Doble (*Double-Entry Bookkeeping*)**.  
> Compatible con **Netlify Serverless (CI/CD con GitHub)** y **Docker Compose para desarrollo local**.

[![NestJS](https://img.shields.io/badge/NestJS-10.4-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Netlify](https://img.shields.io/badge/Netlify-Serverless-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com/)

---

## 📋 Tabla de Contenidos
1. [Visión y Arquitectura del Sistema](#-visión-y-arquitectura-del-sistema)
2. [Características Técnicas Principales](#-características-técnicas-principales)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Guía de Despliegue en Netlify vía GitHub](#-guía-de-despliegue-en-netlify-vía-github)
5. [Guía de Ejecución Local con Docker](#-guía-de-ejecución-local-con-docker)
6. [Credenciales y Datos de Prueba (Seed)](#-credenciales-y-datos-de-prueba-seed)
7. [Documentación Swagger / OpenAPI](#-documentación-swagger--openapi)
8. [Ejemplos de Uso con cURL](#-ejemplos-de-uso-con-curl)
9. [Pruebas Automatizadas](#-pruebas-automatizadas)

---

## 🏛️ Visión y Arquitectura del Sistema

NovaBank Core API simula la plataforma de procesamiento central de una entidad bancaria internacional de gran envergadura. Resuelve problemas reales de ingeniería de software financiero:

```mermaid
graph TD
    Client[Cliente / App Móvil / Swagger UI] -->|HTTPS REST + JWT + Idempotency-Key| Gateway[API Gateway / NestJS Core Banking]
    
    subgraph Core Banking Platform [Monolito Modular NestJS - Clean Architecture]
        AuthMod[Módulo Autenticación & RBAC]
        AccountMod[Módulo Cuentas Bancarias & IBAN]
        LedgerMod[Módulo Libro Mayor & Partida Doble]
        TransferMod[Módulo Transferencias & Idempotencia]
        CardsMod[Módulo Tarjetas & Bloqueos]
        ForexMod[Módulo Divisas & Tipos de Cambio]
        AuditMod[Módulo Auditoría & Cumplimiento]
        HealthMod[Módulo Monitoreo & Healthchecks]
    end
    
    Gateway --> Core Banking Platform
    
    ForexMod <-->|Caché Divisas TTL 1h| Redis[(Redis 7 - Caché & Throttler)]
    TransferMod <-->|Idempotency Cache & Locks| Redis
    
    LedgerMod <-->|Transacciones ACID + Row Locking| Postgres[(PostgreSQL 16 Enterprise DB)]
    AccountMod <--> Postgres
    AuditMod <--> Postgres
```

---

## 🚀 Características Técnicas Principales

- ⚖️ **Libro Mayor por Partida Doble (*Double-Entry General Ledger*)**:
  - Toda transacción genera asientos contables inmutables (`JOURNAL_ENTRIES`).
  - Validación matemática en cada movimiento: $\sum \text{Débitos} = \sum \text{Créditos}$.
  - Los importes se gestionan en céntimos enteros (`BigInt`) para evitar errores de coma flotante.
- 🔒 **Control de Concurrencia Pesimista**:
  - Bloqueo de fila `SELECT ... FOR UPDATE` en PostgreSQL ordenado lexicográficamente para evitar condiciones de carrera (*race conditions*) y bloqueos mutuos (*deadlocks*) en transferencias simultáneas.
- ⚡ **Idempotencia Transaccional**:
  - Soporte de cabecera `Idempotency-Key` en operaciones críticas para prevenir transferencias y cobros duplicados ante reintentos de red.
- 💱 **Mercado Forex y Caché con Redis**:
  - Consulta y conversión de divisas internacionales con estrategia *Cache-Aside* en Redis (TTL 1h).
- 🛡️ **Control de Acceso Basado en Roles (RBAC)**:
  - `CLIENTE`: Cuentas propias, transferencias, extractos y tarjetas.
  - `CAJERO`: Depósitos y retiros en efectivo en ventanilla.
  - `GERENTE`: Aprobaciones y bloqueo administrativo.
  - `AUDITOR`: Acceso de solo lectura a pistas de auditoría inmutables (*Audit Trail*).
  - `ADMIN`: Control total del sistema.
- 📖 **Documentación Swagger / OpenAPI 3.0 Impecable**:
  - Interfaz interactiva en `/docs` con esquemas en español, autenticación Bearer y formato de errores RFC 7807 (*Problem Details*).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework Backend** | NestJS 10 (Node.js 20 LTS, TypeScript Strict) |
| **Base de Datos** | PostgreSQL 16 con Prisma ORM |
| **Caché y Concurrencia** | Redis 7 (ioredis con fallback resiliente en memoria) |
| **Documentación** | Swagger / OpenAPI 3.0 (`@nestjs/swagger`) |
| **Seguridad** | Passport JWT, bcryptjs, Helmet, Throttler |
| **Serverless & CI/CD** | Netlify Functions, `@codegenie/serverless-express`, `netlify.toml` |
| **Contenerización** | Docker multi-stage & Docker Compose |
| **Testing** | Jest & Supertest |

---

## ☁️ Guía de Despliegue en Netlify vía GitHub

El proyecto está 100% adaptado para desplegarse como **Backend Serverless** en Netlify conectado directamente a tu repositorio de GitHub.

### Paso 1: Subir el proyecto a GitHub
```bash
git init
git add .
git commit -m "feat: NovaBank Core API lista para Netlify"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/novabank-backend.git
git push -u origin main
```

### Paso 2: Conectar el repositorio en Netlify
1. Ve a [Netlify](https://app.netlify.com/) e inicia sesión.
2. Pulsa **"Add new site"** $\rightarrow$ **"Import an existing project"**.
3. Selecciona **GitHub** y autoriza tu repositorio `novabank-backend`.
4. Netlify detectará automáticamente el archivo `netlify.toml` con la configuración de build y funciones.

### Paso 3: Configurar Variables de Entorno en Netlify UI
En el panel de Netlify (*Site configuration* $\rightarrow$ *Environment variables*), añade:

| Variable | Descripción | Ejemplo / Proveedor |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (con pool de conexiones) | [Neon.tech](https://neon.tech) / [Supabase](https://supabase.com) (`?pgbouncer=true`) |
| `REDIS_URL` | Conexión Redis Cloud o Upstash | [Upstash Redis](https://upstash.com) (`rediss://default:...@...upstash.io:6379`) |
| `JWT_SECRET` | Clave secreta para tokens JWT | `novabank_super_secret_jwt_2026` |
| `JWT_REFRESH_SECRET`| Clave secreta para refresh tokens | `novabank_refresh_secret_2026` |
| `NODE_ENV` | Entorno de ejecución | `production` |

### Paso 4: Despliegue y Acceso
- Tras pulsar **Deploy site**, tu aplicación estará disponible en:
  - 🌐 **Swagger UI Interactivo**: `https://<tu-app>.netlify.app/docs` (o simplemente `https://<tu-app>.netlify.app/`)
  - 🩺 **Healthcheck**: `https://<tu-app>.netlify.app/api/v1/health`
  - 🚀 **Endpoints API**: `https://<tu-app>.netlify.app/api/v1/*`

---

## 🐳 Guía de Ejecución Local con Docker

Si deseas ejecutar todo el ecosistema en tu máquina local sin depender de internet ni proveedores cloud:

### 1. Clonar y levantar el stack
```bash
# 1. Copiar archivo de entorno
cp .env.example .env

# 2. Levantar API + PostgreSQL 16 + Redis 7 + Adminer
docker compose up -d --build
```

### 2. Ejecutar migraciones y sembrado de datos (Seed)
```bash
# Ejecutar dentro del contenedor o localmente
npm run prisma:migrate
npm run prisma:seed
```

### 3. Servicios disponibles localmente:
- 📖 **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- 🚀 **API Base URL**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- 🗄️ **Adminer (Gestor Web DB)**: [http://localhost:8080](http://localhost:8080) *(Servidor: `postgres`, Usuario: `postgres`, Clave: `postgres_secure_2026`, DB: `novabank_db`)*

---

## 👥 Credenciales y Datos de Prueba (Seed)

Todas las cuentas vienen precargadas con la contraseña: **`Password123!`**

| Rol | Correo Electrónico | Saldo Inicial | Descripción |
|---|---|---|---|
| **ADMIN** | `admin@novabank.es` | – | Administrador del sistema |
| **CLIENTE** | `cliente@novabank.es` | **15.450,00 €** (Corriente) / **50.000,00 €** (Ahorro) | Cliente con tarjeta de débito activa |
| **CLIENTE** | `maria.garcia@novabank.es` | **8.200,00 €** (Corriente) | Segunda cliente para transferencias |
| **CAJERO** | `cajero@novabank.es` | – | Cajero de ventanilla (Depósitos/Retiros) |
| **GERENTE**| `gerente@novabank.es` | – | Gerente de sucursal (Bloqueos) |
| **AUDITOR**| `auditor@novabank.es` | – | Auditor de Compliance (Audit Logs) |

---

## 📖 Documentación Swagger / OpenAPI

La documentación Swagger está disponible en `/docs` y cuenta con:
1. **Autenticación interactiva**: Botón `Authorize` para pegar el JWT Bearer.
2. **Esquemas de DTOs completos**: Validaciones de IBANs, importes mínimos y formatos.
3. **Códigos de respuesta**: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `409 Conflict` (Idempotencia), `422 Unprocessable Entity` (Saldo insuficiente).

---

## 💻 Ejemplos de Uso con cURL

### 1. Iniciar Sesión (Obtener JWT)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@novabank.es",
    "password": "Password123!"
  }'
```

### 2. Consultar Cuentas y Saldos
```bash
curl -X GET http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer <TU_TOKEN_JWT>"
```

### 3. Ejecutar Transferencia con Idempotency-Key
```bash
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Authorization: Bearer <TU_TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: d9b2d63d-a233-4f25-9b2f-871c5a92a101" \
  -d '{
    "fromAccountId": "<ID_CUENTA_ORIGEN>",
    "destination": "ES4421000418405556667778",
    "amount": 250.50,
    "description": "Pago de servicios y consultoría"
  }'
```

### 4. Consultar Extracto Bancario con Partida Doble
```bash
curl -X GET http://localhost:3000/api/v1/accounts/<ID_CUENTA>/statement \
  -H "Authorization: Bearer <TU_TOKEN_JWT>"
```

### 5. Consultar Cotizaciones Forex (Cacheadas en Redis)
```bash
curl -X GET http://localhost:3000/api/v1/forex/rates
```

### 6. Healthcheck del Sistema
```bash
curl -X GET http://localhost:3000/api/v1/health
```

---

## 🧪 Pruebas Automatizadas

```bash
# Ejecutar pruebas unitarias (Libro Mayor y validación de IBANs)
npm test

# Ejecutar pruebas con cobertura
npm run test:cov
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT** — código libre para fines educativos y profesionales.
