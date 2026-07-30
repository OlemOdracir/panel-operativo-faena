# Panel Operativo de Faena

Sistema full-stack para monitorear sensores mineros, abrir incidentes ante lecturas fuera de rango y coordinar órdenes de trabajo en terreno.

La regla central es una sola: **una lectura fuera del rango de su sensor abre un incidente**, y esa regla vive únicamente en la API. Desde ahí, supervisión reconoce y resuelve incidentes, y coordina órdenes de trabajo con equipos de faena.

## Alcance implementado

| Pieza               | Detalle                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Modelo relacional   | 7 tablas: `areas`, `sensors`, `readings`, `incidents`, `teams`, `users`, `work_orders`            |
| Ciclo de incidentes | `OPEN → ACKNOWLEDGED → RESOLVED`                                                                  |
| Ciclo de órdenes    | `OPEN → ASSIGNED → IN_PROGRESS → CLOSED`, con asignación a un equipo                              |
| Pantallas           | Ingreso, resumen, lista de incidentes, detalle de incidente y tablero de órdenes                  |
| Roles               | `SUPERVISOR` y `ADMIN`; la identidad sale de la sesión, nunca del cuerpo de la petición           |
| Estados de datos    | TanStack Query en todo el panel, distinguiendo cargando, error, vacío y contenido                 |
| Extras              | Generador Python de lecturas, Swagger vivo, logs con `X-Request-Id`, filtros y paginación remotos |

## Requisitos

- Docker Desktop con Compose.
- Node.js 24+ y pnpm 11+ solo para desarrollo fuera de contenedores.
- Python 3.11+ solo para el generador de lecturas.

## Inicio rápido con Docker

```bash
cp .env.example .env
# Reemplaza POSTGRES_PASSWORD, JWT_SECRET y las dos contraseñas de seed.
docker compose up --build -d
docker compose ps
```

En PowerShell, la primera línea es `Copy-Item .env.example .env`; el resto es idéntico.

Compose aplica migraciones y ejecuta el seed antes de levantar la API, así que el panel arranca con incidentes y órdenes que gestionar. El seed es idempotente: se puede volver a correr sobre una base ya usada.

| Servicio   | URL                            |
| ---------- | ------------------------------ |
| Panel web  | http://localhost:8080          |
| API        | http://localhost:13000/api/v1  |
| Swagger    | http://localhost:13000/docs    |
| PostgreSQL | localhost:5432 (solo loopback) |

Usuarios de demostración: `supervisor@faena.local` y `admin@faena.local`, con las contraseñas que definiste en `SEED_SUPERVISOR_PASSWORD` y `SEED_ADMIN_PASSWORD`.

## Variables de entorno

Todas viven en `.env`, que no se versiona. `.env.example` trae el archivo completo con valores de desarrollo.

| Variable                                              | Para qué sirve                                              | Valor de ejemplo                     |
| ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `API_PORT` · `WEB_PORT` · `POSTGRES_PORT`             | Puertos publicados en el host                               | `13000` · `8080` · `5432`            |
| `NODE_ENV` · `LOG_LEVEL`                              | Modo de ejecución y verbosidad de los logs JSON             | `development` · `debug`              |
| `CORS_ORIGIN`                                         | Orígenes permitidos, separados por coma                     | `http://localhost:8080`              |
| `VITE_API_URL`                                        | URL de la API que consume el panel                          | `http://localhost:13000/api/v1`      |
| `SWAGGER_ENABLED`                                     | Publica `/docs`                                             | `true`                               |
| `POSTGRES_DB` · `POSTGRES_USER` · `POSTGRES_PASSWORD` | Credenciales de la base                                     | `faena` · `faena_app` · —            |
| `DATABASE_URL`                                        | Cadena de conexión de Prisma                                | `postgresql://…/faena?schema=public` |
| `JWT_SECRET`                                          | Firma de la sesión; mínimo 32 caracteres                    | —                                    |
| `AUTH_COOKIE_SECURE`                                  | `true` en producción, detrás de TLS                         | `false` en local                     |
| `SEED_ADMIN_PASSWORD` · `SEED_SUPERVISOR_PASSWORD`    | Contraseñas de los usuarios sembrados; mínimo 12 caracteres | —                                    |

## Usar la API

Todas las rutas usan el prefijo `/api/v1`. La documentación viva está en Swagger y el contrato generado en [`docs/openapi.json`](docs/openapi.json).

| Método  | Ruta                                                      | Notas                                             |
| ------- | --------------------------------------------------------- | ------------------------------------------------- |
| `GET`   | `/health`                                                 | Público                                           |
| `POST`  | `/auth/login`                                             | Sin sesión previa, pero exige CSRF                |
| `GET`   | `/auth/csrf` · `/auth/me`                                 | Token de doble envío y usuario actual             |
| `POST`  | `/auth/logout`                                            | Cierra la sesión                                  |
| `GET`   | `/areas` · `/sensors` · `/teams`                          | Catálogos                                         |
| `POST`  | `/readings`                                               | Solo `ADMIN`; abre el incidente en la transacción |
| `GET`   | `/incidents` · `/incidents/:id`                           | Filtros, orden y paginación remotos               |
| `PATCH` | `/incidents/:id/status`                                   | Respeta la máquina de estados                     |
| `GET`   | `/work-orders` · `/work-orders/:id`                       | Filtros, orden y paginación remotos               |
| `POST`  | `/work-orders`                                            | Puede nacer de un incidente o ser preventiva      |
| `PATCH` | `/work-orders/:id/assignment` · `/work-orders/:id/status` | Asignación y avance de estado                     |

**Toda mutación exige el token CSRF de doble envío, incluido el login.** Sin la cabecera `X-CSRF-Token` la petición se rechaza con `403` antes de validar el cuerpo. El token se pide una vez y se reutiliza.

```bash
# 1 · Token CSRF (deja además la cookie de doble envío)
CSRF=$(curl -s -c cookies.txt http://localhost:13000/api/v1/auth/csrf \
  | sed -E 's/.*"token":"([^"]+)".*/\1/')

# 2 · Sesión (devuelve la cookie HttpOnly)
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:13000/api/v1/auth/login \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" \
  -d '{"email":"supervisor@faena.local","password":"TU_SEED_SUPERVISOR_PASSWORD"}'

# 3 · Lectura con filtros y paginación
curl -s -b cookies.txt \
  'http://localhost:13000/api/v1/incidents?status=OPEN&severity=CRITICAL&page=1&pageSize=20'

# 4 · Mutación: reconocer un incidente
curl -s -b cookies.txt -c cookies.txt -X PATCH \
  "http://localhost:13000/api/v1/incidents/$ID/status" \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" \
  -d '{"status":"ACKNOWLEDGED"}'
```

Toda entrada se valida con los contratos Zod de `packages/contracts` antes de tocar la base. Un identificador inexistente responde `404`; un cuerpo inválido, `400` con el detalle por campo:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "La solicitud contiene datos no válidos.",
  "requestId": "acefe07e-00f0-42fd-a1a0-d0afb22fed51",
  "details": [{ "path": ["email"], "message": "Invalid email address" }]
}
```

El `requestId` se repite en la cabecera `X-Request-Id` y en los logs JSON, para seguir una petición de punta a punta.

## Desarrollo local

```bash
corepack enable
corepack pnpm install
corepack pnpm --filter @faena/contracts build
corepack pnpm --filter @faena/api prisma:generate
corepack pnpm dev
```

Conviene dejar PostgreSQL en Docker y correr API y panel fuera. Migraciones y datos:

```bash
corepack pnpm --filter @faena/api prisma:migrate
corepack pnpm --filter @faena/api prisma:seed
```

En Windows, si una política de seguridad bloquea el binario nativo de Prisma, aplica las migraciones vía `docker compose up`: el contenedor Linux es el entorno soportado y reproducible.

## Pruebas y calidad

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm format:check
corepack pnpm encoding:check
corepack pnpm docs:check
```

`corepack pnpm test` cubre dominio, servicios, seguridad y capa HTTP en la API, y estados, formularios y mutaciones en el panel. Dos suites necesitan infraestructura:

```bash
corepack pnpm test:integration   # levanta PostgreSQL, migra, siembra y corre la integración real
corepack pnpm test:e2e:audit     # Playwright contra el sistema levantado con Docker Compose
```

`test:integration` deja la base en pie; deténla con `corepack pnpm compose:down`. Para Playwright, la primera vez instala el navegador con `corepack pnpm exec playwright install chromium`; `PLAYWRIGHT_BASE_URL`, `E2E_API_URL`, `E2E_SUPERVISOR_PASSWORD` y `E2E_ADMIN_PASSWORD` permiten apuntar a otro entorno sin leer el `.env` local.

CI exige cobertura mínima de 80% en líneas y funciones y 70% en ramas para la API, y 80% en las cuatro métricas para el panel; ambos proyectos están por encima de esos umbrales.

| Control              | Herramienta                          | Propósito                                                                   |
| -------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| Formato              | Prettier                             | Estilo uniforme en todo el monorepo                                         |
| Codificación         | `encoding:check`                     | UTF-8 válido, sin caracteres de reemplazo ni mojibake                       |
| Análisis backend     | ESLint y TypeScript ESLint           | Errores, tipos inseguros y malas prácticas                                  |
| Análisis frontend    | Oxlint                               | React y TypeScript sin advertencias                                         |
| Tipado               | TypeScript estricto                  | Contratos verificados y sin `any` explícito                                 |
| Validación           | Zod                                  | Entradas y respuestas validadas en ejecución                                |
| Pruebas backend      | Node Test Runner                     | Dominio, servicios, seguridad, capa HTTP e integración                      |
| Pruebas frontend     | Vitest y Testing Library             | Estados, formularios y acciones del usuario                                 |
| Auditoría E2E        | Playwright                           | Login, roles, teclado y foco del Drawer, y rutas protegidas en un navegador |
| Cobertura            | V8 Coverage                          | Impedir regresiones de cobertura                                            |
| Persistencia         | Prisma Validate y migraciones reales | Esquema y compatibilidad con PostgreSQL                                     |
| Dependencias         | `pnpm audit`                         | Rechazar vulnerabilidades productivas de severidad alta                     |
| Historial Git        | Commitlint, Husky y lint-staged      | Conventional Commits y formato antes del commit                             |
| API                  | OpenAPI check                        | Verificar que la referencia incluya los endpoints requeridos                |
| Contenedores         | Docker Compose validation            | Definición de servicios válida                                              |
| Integración continua | GitHub Actions                       | Ejecutar todos los controles desde un entorno limpio                        |

## Estructura

```text
apps/api                 NestJS: módulos por dominio, Prisma y seguridad
apps/web                 React: rutas, vistas por feature y TanStack Query
packages/contracts       esquemas Zod, tipos y catálogo i18n `esCL` compartidos
tools/reading-generator  simulador Python/pandas
docs                     arquitectura, patrones, ADR, amenazas y OpenAPI
```

Backend y frontend se organizan por dominio, no por tipo de archivo: cada feature agrupa sus vistas, tablas y claves de consulta. Los textos de interfaz y los mensajes de la API se centralizan en `packages/contracts/src/i18n.ts`; los enums de base y API se mantienen en inglés como contrato estable y se traducen a español de Chile solo al presentarlos.

## Generador de lecturas

```bash
docker compose --profile live up --build reading-generator
```

O fuera de Docker:

```bash
cd tools/reading-generator
python -m venv .venv && . .venv/bin/activate
pip install -e .
FAENA_ADMIN_EMAIL=admin@faena.local FAENA_ADMIN_PASSWORD='...' faena-reading-generator
```

El generador no contiene reglas de negocio: solo publica lecturas en `POST /readings`. La regla «fuera de rango → incidente» vive en la API, de modo que hay un solo dueño del dato.

## Decisiones de diseño

Monolito modular con separación Presentación–Aplicación–Dominio–Infraestructura. Las reglas críticas se prueban de forma automatizada, las entradas se validan antes de acceder a datos y cada cambio pasa los gates de CI. No se incorporan CQRS, Event Sourcing ni microservicios porque no aportan valor proporcional al alcance.

El desarrollo es incremental por funcionalidad: cada cambio vertical incorpora contrato, regla, persistencia, API, interfaz, pruebas y documentación. El historial usa [Conventional Commits](https://www.conventionalcommits.org/) para que el repositorio explique su evolución; no hay un único commit final.

La arquitectura detallada e invariantes están en [`docs/architecture.md`](docs/architecture.md), los patrones en [`docs/architecture-patterns.md`](docs/architecture-patterns.md) y las decisiones en [`docs/adr/`](docs/adr/). Seguridad en [`SECURITY.md`](SECURITY.md) y modelo de amenazas en [`docs/threat-model.md`](docs/threat-model.md).

## Seguridad

- No se versionan `.env` ni credenciales; `.env.example` documenta las variables.
- Cookies de sesión HttpOnly con SameSite y protección CSRF de doble envío.
- Contraseñas con Argon2id, rate limiting y errores genéricos ante credenciales inválidas.
- CORS explícito, Helmet, límites de cuerpo y logs sin secretos.
- La identidad usada en auditoría sale de la sesión, nunca del cuerpo.
- En producción se termina TLS delante de la aplicación y se activa `AUTH_COOKIE_SECURE=true`.
