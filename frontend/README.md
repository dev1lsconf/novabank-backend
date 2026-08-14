# NovaBank Frontend

Dashboard bancario profesional desarrollado con Next.js 14, React, Tailwind CSS y Zustand.

## Características

- **Dashboard Principal**: Vista general de saldos, cuentas, tarjetas y tipos de cambio
- **Gestión de Cuentas**: Visualización de cuentas bancarias con saldos y estados
- **Transferencias**: Envío de transferencias entre cuentas con idempotencia
- **Tarjetas**: Gestión de tarjetas de débito/crédito con bloqueo/desbloqueo
- **Forex**: Conversor de divisas y tabla de tipos de cambio
- **Operaciones**: Depósitos y retiros en ventanilla
- **Usuarios**: Administración de usuarios (solo admin/gerente/auditor)
- **Auditoría**: Logs de auditoría inmutables (solo admin/auditor)
- **Reportes**: Analítica y estadísticas del negocio (solo admin/gerente/auditor)
- **Configuración**: Perfil, tema claro/oscuro, notificaciones

## Stack Tecnológico

- **Framework**: Next.js 14 con App Router
- **UI**: React 18, Tailwind CSS, Lucide Icons
- **Estado**: Zustand con persistencia
- **Notificaciones**: React Hot Toast
- **HTTP**: Axios con interceptores y refresh token
- **Formato**: date-fns

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout raíz
│   │   ├── page.tsx            # Página inicial con redirect
│   │   ├── globals.css         # Estilos globales
│   │   ├── login/              # Página de login/registro
│   │   └── dashboard/          # Dashboard protegido
│   │       ├── layout.tsx      # Layout del dashboard
│   │       ├── page.tsx        # Dashboard principal
│   │       ├── accounts/       # Gestión de cuentas
│   │       ├── transfers/      # Transferencias
│   │       ├── cards/          # Tarjetas
│   │       ├── forex/          # Mercado de divisas
│   │       ├── operations/     # Depósitos/retiros
│   │       ├── users/          # Administración usuarios
│   │       ├── audit/          # Auditoría
│   │       ├── reports/        # Reportes
│   │       └── settings/       # Configuración
│   ├── components/
│   │   ├── ui/                 # Componentes UI reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Select.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx     # Navegación lateral
│   │       └── Header.tsx      # Header superior
│   ├── lib/
│   │   ├── api.ts              # Cliente API con Axios
│   │   └── utils.ts            # Utilidades y formatters
│   ├── store/
│   │   └── index.ts            # Estado global con Zustand
│   ├── hooks/
│   │   └── useAuth.ts          # Hook de autenticación
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── next-env.d.ts
```

## Scripts

```bash
npm run dev      # Desarrollo en puerto 3001
npm run build    # Build de producción
npm run start    # Iniciar producción
npm run lint     # Linter
```

## Variables de Entorno

Crea un archivo `.env.local` en la carpeta `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Seguridad

- **Autenticación**: JWT con access/refresh tokens
- **Autorización**: Guards por rol en el backend
- **CORS**: Configurado para desarrollo
- **Headers**: Helmet en backend, CSP desactivado para Swagger
- **Sanitización**: Validación de DTOs con class-validator

## Acceso Rápido

- **Login**: `/login`
- **Dashboard**: `/dashboard`
- **Cuentas**: `/dashboard/accounts`
- **Transferencias**: `/dashboard/transfers`
- **Tarjetas**: `/dashboard/cards`
- **Forex**: `/dashboard/forex`
- **Operaciones**: `/dashboard/operations`
- **Usuarios**: `/dashboard/users` (admin)
- **Auditoría**: `/dashboard/audit` (admin/auditor)
- **Reportes**: `/dashboard/reports` (admin/gerente)
- **Configuración**: `/dashboard/settings`

## Próximos Pasos

1. Instalar dependencias: `npm install`
2. Configurar variables de entorno
3. Iniciar backend: `npm run start:dev` (en raíz del proyecto)
4. Iniciar frontend: `npm run dev` (en carpeta `frontend/`)
5. Acceder a `http://localhost:3001`
