# Panel Operativo de Faena

Sistema full-stack para monitorear sensores mineros, abrir incidentes ante lecturas fuera de rango y coordinar órdenes de trabajo en terreno.

## Qué incluye

- API NestJS modular con PostgreSQL, Prisma, Zod y Swagger.
- Modelo relacional de áreas, sensores, lecturas, incidentes, equipos, usuarios y órdenes.
- Incidentes `OPEN → ACKNOWLEDGED → RESOLVED`.
- Órdenes `OPEN → ASSIGNED → IN_PROGRESS → CLOSED`.
- Autenticación con usuarios `SUPERVISOR` y `ADMIN`, cookie HttpOnly y CSRF.
- Panel React con TanStack Query y estados de carga, error, vacío y contenido.
- Seed reproducible con lecturas dentro y fuera de rango.
- Generador opcional Python/pandas para simular lecturas en vivo.
- Logs JSON con `X-Request-Id`.

## Requisitos

- Docker Desktop con Compose.
- Node.js 24+ y pnpm 11+ para desarrollo local.
- Python 3.11+ solo para el generador.

## Inicio rápido con Docker

```powershell
Copy-Item .env.example .env
# Cambia POSTGRES_PASSWORD, JWT_SECRET y las dos contraseñas de seed.
docker compose up --build -d
docker compose ps
```

Servicios locales:

| Servicio   | URL                            |
| ---------- | ------------------------------ |
| Panel web  | http://localhost:8080          |
| API        | http://localhost:13000/api/v1  |
| Swagger    | http://localhost:13000/docs    |
| PostgreSQL | localhost:5432 (solo loopback) |

Los servicios `database-migrate` y `database-seed` se ejecutan antes de la API. El seed es idempotente.

Usuarios de demostración: `admin@faena.local` y `supervisor@faena.local`, con las contraseñas definidas en `SEED_ADMIN_PASSWORD` y `SEED_SUPERVISOR_PASSWORD`.

## Desarrollo local

```powershell
corepack enable
corepack pnpm install
corepack pnpm --filter @faena/contracts build
corepack pnpm --filter @faena/api prisma:generate
corepack pnpm dev
```

Para la base local se puede dejar PostgreSQL en Docker y ejecutar la API/web fuera de Docker. Las migraciones se aplican con:

```powershell
corepack pnpm --filter @faena/api prisma:migrate
corepack pnpm --filter @faena/api prisma:seed
```

En Windows, si una política de seguridad bloquea el binario nativo de Prisma, ejecuta las migraciones mediante `docker compose up`; el contenedor Linux es el entorno soportado y reproducible.

## Comandos de calidad

```powershell
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## API principal

Todas las rutas usan el prefijo `/api/v1`.

- `GET /health`
- `GET /auth/csrf`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- `GET /areas`, `GET /sensors`, `GET /teams`
- `POST /readings` — solo admin; abre el incidente dentro de la transacción.
- `GET /incidents`, `GET /incidents/:id`, `PATCH /incidents/:id/status`
- `GET /work-orders`, `POST /work-orders`, `GET /work-orders/:id`
- `PATCH /work-orders/:id/assignment`, `PATCH /work-orders/:id/status`

Las entradas se validan con los contratos Zod de `packages/contracts`. La documentación viva está en Swagger y el contrato generado se publica en `docs/openapi.json`.

## Generador en vivo

```powershell
docker compose --profile live up --build reading-generator
```

O localmente:

```powershell
cd tools/reading-generator
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
$env:FAENA_ADMIN_EMAIL='admin@faena.local'
$env:FAENA_ADMIN_PASSWORD='la contraseña configurada en .env'
faena-reading-generator
```

El generador no contiene reglas de incidentes: solo publica lecturas en la API.

## Estructura

```text
apps/api                 NestJS, dominios, Prisma y seguridad
apps/web                 React, rutas, vistas y TanStack Query
packages/contracts       esquemas Zod y tipos compartidos
tools/reading-generator  simulador Python/pandas
docs                     arquitectura, seguridad y API
```

La arquitectura detallada, invariantes y decisiones están en [`docs/architecture.md`](docs/architecture.md) y los ADR en [`docs/adr/`](docs/adr/). Las prácticas de seguridad están en [`SECURITY.md`](SECURITY.md) y el modelo de amenazas en [`docs/threat-model.md`](docs/threat-model.md).

## Seguridad

- No se versionan `.env` ni credenciales.
- Cookies de sesión HttpOnly/SameSite y protección CSRF.
- Contraseñas con Argon2id, rate limiting y errores genéricos.
- CORS explícito, Helmet, límites de body y logs sin secretos.
- La identidad usada para auditoría sale de la sesión, nunca del body.
- En producción se debe terminar TLS delante de la aplicación y activar `AUTH_COOKIE_SECURE=true`.

## Git

Los cambios deben usar [Conventional Commits](https://www.conventionalcommits.org/). Cada funcionalidad incluye sus pruebas y documentación; no se utiliza un único commit final.
