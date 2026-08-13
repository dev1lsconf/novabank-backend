# 🏛️ NovaBank Core API — Sistema Bancario Empresarial

> **API RESTful de Microservicios y Core Bancario Documentada**  
> Diseñada bajo principios de **Clean Architecture**, **Domain-Driven Design (DDD)** y **Contabilidad por Partida Doble (*Double-Entry Bookkeeping*)**.  
> Totalmente autocontenida con **Base de Datos JSON en memoria**, optimizada para **Netlify Serverless (CI/CD con GitHub)** y **Docker Compose para desarrollo local**.

[![NestJS](https://img.shields.io/badge/NestJS-10.4-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JSON DB](https://img.shields.io/badge/Database-JSON_In--Memory-FFA500?style=for-the-badge&logo=json&logoColor=black)](https://json.org)
[![Redis](https://img.shields.io/badge/Redis-7.0_Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Netlify](https://img.shields.io/badge/Netlify-Serverless-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com/)

---

## 📋 Tabla de Contenidos
1. [Visión y Arquitectura del Sistema](#-visión-y-arquitectura-del-sistema)
2. [Características Técnicas Principales](#-características-técnicas-principales)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Guía de Despliegue en Netlify vía GitHub (Cero Configuración)](#-guía-de-despliegue-en-netlify-vía-github-cero-configuración)
5. [Guía de Ejecución Local con Docker o Node](#-guía-de-ejecución-local-con-docker-o-node)
6. [Credenciales y Datos Precargados (JSON Seed)](#-credenciales-y-datos-precargados-json-seed)
7. [Documentación Swagger / OpenAPI](#-documentación-swagger--openapi)
8. [Ejemplos de Uso con cURL](#-ejemplos-de-uso-con-curl)
9. [Pruebas Automatizadas](#-pruebas-automatizadas)

---

## 🏛️ Visión y Arquitectura del Sistema

NovaBank Core API simula la plataforma central de procesamiento financiero de una entidad bancaria comercial. Resuelve los desafíos de consistencia e integridad financiera mediante una arquitectura desacoplada:

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
    
    LedgerMod <-->|Almacenamiento Transaccional In-Memory| JsonDB[(Base de Datos JSON Autocontenida)]
    AccountMod <--> JsonDB
    AuditMod <--> JsonDB
```

---

## 🚀 Características Técnicas Principales

- ⚖️ **Libro Mayor por Partida Doble (*Double-Entry General Ledger*)**:
  - Toda transacción genera asientos contables inmutables (`JOURNAL_ENTRIES`).
  - Validación matemática en cada movimiento: $\sum \text{Débitos} = \sum \text{Créditos}$.
  - Los importes se gestionan en céntimos enteros para evitar errores de coma flotante.
- ⚡ **Idempotencia Transaccional**:
  - Soporte de cabecera `Idempotency-Key` en operaciones críticas para prevenir transferencias duplicadas ante reintentos de red.
- 💱 **Mercado Forex y Caché con Redis**:
  - Consulta y conversión de divisas internacionales con estrategia *Cache-Aside* en Redis (con fallback en memoria).
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
| **Almacenamiento de Datos** | Base de Datos JSON en memoria estructurada con datos reales |
| **Caché y Concurrencia** | Redis 7 (ioredis con fallback resiliente en memoria) |
| **Documentación** | Swagger / OpenAPI 3.0 (`@nestjs/swagger`) |
| **Seguridad** | Passport JWT, bcryptjs, Helmet, Throttler |
| **Serverless & CI/CD** | Netlify Functions, `@codegenie/serverless-express`, `netlify.toml` |
| **Contenerización** | Docker multi-stage & Docker Compose |
| **Testing** | Jest & Supertest |

---

## ☁️ Guía de Despliegue en Netlify vía GitHub (Cero Configuración)

Al utilizar el motor de base de datos JSON autocontenido, el proyecto **no requiere configurar ninguna base de datos externa en Netlify**.

### Paso 1: Subir el proyecto a GitHub
```bash
git add .
git commit -m "feat: NovaBank Core API lista para Netlify"
git push origin main
```

### Paso 2: Conectar el repositorio en Netlify
1. Ve a [Netlify](https://app.netlify.com/) e inicia sesión.
2. Pulsa **"Add new site"** $\rightarrow$ **"Import an existing project"** $\rightarrow$ **GitHub**.
3. Selecciona tu repositorio: **`dev1lsconf/novabank-backend`**.
4. Haz clic en **Deploy site**. ¡El build tardará menos de 15 segundos!

### Paso 3: Acceso Inmediato
- 🌐 **Swagger UI Interactivo**: `https://<tu-sitio>.netlify.app/docs` (o en la raíz `https://<tu-sitio>.netlify.app/`)
- 🩺 **Healthcheck**: `https://<tu-sitio>.netlify.app/api/v1/health`
- 🚀 **API Base URL**: `https://<tu-sitio>.netlify.app/api/v1/*`

---

## 👥 Credenciales y Datos Precargados (JSON Seed)

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

## 💻 Ejemplos de Uso con cURL

### 1. Iniciar Sesión (Obtener JWT)
```bash
curl -X POST https://<tu-app>.netlify.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@novabank.es",
    "password": "Password123!"
  }'
```

### 2. Consultar Cuentas y Saldos
```bash
curl -X GET https://<tu-app>.netlify.app/api/v1/accounts \
  -H "Authorization: Bearer <TU_TOKEN_JWT>"
```

### 3. Ejecutar Transferencia con Idempotency-Key
```bash
curl -X POST https://<tu-app>.netlify.app/api/v1/transfers \
  -H "Authorization: Bearer <TU_TOKEN_JWT>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: d9b2d63d-a233-4f25-9b2f-871c5a92a101" \
  -d '{
    "fromAccountId": "b1b1b001-0000-4000-b000-000000000002",
    "destination": "ES4421000418405556667778",
    "amount": 250.50,
    "description": "Pago de servicios y consultoría"
  }'
```

### 4. Consultar Extracto Bancario con Partida Doble
```bash
curl -X GET https://<tu-app>.netlify.app/api/v1/accounts/b1b1b001-0000-4000-b000-000000000002/statement \
  -H "Authorization: Bearer <TU_TOKEN_JWT>"
```

### 5. Consultar Cotizaciones Forex (Cacheadas en Redis)
```bash
curl -X GET https://<tu-app>.netlify.app/api/v1/forex/rates
```

### 6. Healthcheck del Sistema
```bash
curl -X GET https://<tu-app>.netlify.app/api/v1/health
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
