# Panel Operativo de Faena

Sistema de monitoreo y gestión operacional para una faena minera. El panel integrará lecturas de
sensores, detección de incidentes y órdenes de trabajo desde la ingesta de datos hasta la interfaz
utilizada en terreno.

> **Estado:** infraestructura inicial preparada. La API de salud, la aplicación React, PostgreSQL,
> Docker Compose y los controles de calidad ya son ejecutables. El modelo de negocio y las
> pantallas operacionales se implementarán en los siguientes incrementos.

## Objetivo

Construir un corte pequeño pero completo de un sistema operacional que sea fácil de ejecutar,
entender y mantener. El foco está en reglas de negocio explícitas, tipado estricto, seguridad,
pruebas significativas y documentación verificable.

## Capacidades previstas

- Áreas y sensores con unidad y rango operacional.
- Registro de lecturas con fecha de medición y recepción.
- Apertura transaccional de incidentes ante lecturas fuera de rango.
- Órdenes de trabajo asignables a equipos.
- Ciclo `OPEN → ASSIGNED → IN_PROGRESS → CLOSED`.
- Autenticación y autorización para supervisores y administradores.
- Panel React con estados de carga, error, vacío y contenido.

## Stack

| Capa          | Tecnología                                  |
| ------------- | ------------------------------------------- |
| API           | NestJS, TypeScript y Zod                    |
| Frontend      | React, Vite y TanStack Query                |
| Datos         | PostgreSQL                                  |
| Contrato HTTP | REST y OpenAPI/Swagger                      |
| Pruebas       | Node Test Runner, Vitest y Testing Library  |
| Calidad       | ESLint/Oxlint, Prettier, Commitlint y Husky |
| Ejecución     | Docker Compose y GitHub Actions             |

## Estructura

```text
.
├── apps/
│   ├── api/                  # API NestJS organizada por dominio
│   └── web/                  # Aplicación React
├── docs/
│   └── architecture.md       # Decisiones, modelo e invariantes
├── .github/
│   ├── workflows/ci.yml      # Calidad automatizada
│   └── dependabot.yml
├── compose.yaml
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md
```

La motivación y las reglas de dependencia están explicadas en
[`docs/architecture.md`](docs/architecture.md).

## Requisitos

### Ejecución local

- Node.js 24 o superior.
- pnpm 11 o superior, administrado con Corepack.
- Docker con Docker Compose.

### Solo contenedores

- Docker con Docker Compose.

## Inicio rápido con Docker

1. Crea la configuración local:

   ```bash
   cp .env.example .env
   ```

   En PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Reemplaza en `.env` `POSTGRES_PASSWORD` y `JWT_SECRET` por valores locales propios.

3. Construye e inicia el sistema:

   ```bash
   docker compose up --build
   ```

4. Comprueba los servicios:

   | Servicio   | URL                                   |
   | ---------- | ------------------------------------- |
   | Panel      | <http://localhost:8080>               |
   | API health | <http://localhost:3000/api/v1/health> |
   | Swagger    | <http://localhost:3000/docs>          |
   | PostgreSQL | `localhost:5432`                      |

Para detener los contenedores:

```bash
docker compose down
```

Para eliminar además los datos locales de PostgreSQL:

```bash
docker compose down --volumes
```

Este último comando elimina el volumen de desarrollo y no debe utilizarse si se necesitan conservar
los datos.

## Desarrollo local

1. Copia y ajusta el entorno:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Habilita la versión de pnpm declarada por el repositorio:

   ```bash
   corepack enable
   ```

   Si Windows no permite crear el shim global sin privilegios, no es necesario cambiar la política
   del sistema: utiliza `corepack pnpm` en lugar de `pnpm` en los comandos siguientes.

3. Instala las dependencias respetando el lockfile:

   ```bash
   pnpm install --frozen-lockfile
   ```

   Fallback sin shim global:

   ```bash
   corepack pnpm install --frozen-lockfile
   ```

4. Inicia PostgreSQL:

   ```bash
   docker compose up database --detach
   ```

5. Inicia API y frontend con recarga:

   ```bash
   pnpm dev
   ```

En desarrollo, React utiliza <http://localhost:5173> y NestJS
<http://localhost:3000/api/v1>.

## Variables de entorno

| Variable            | Requerida | Propósito                                    |
| ------------------- | --------- | -------------------------------------------- |
| `NODE_ENV`          | Sí        | `development`, `test` o `production`         |
| `API_PORT`          | Sí        | Puerto público de la API                     |
| `WEB_PORT`          | Sí        | Puerto del panel servido por Compose         |
| `CORS_ORIGIN`       | Sí        | Orígenes web autorizados, separados por coma |
| `VITE_API_URL`      | Sí        | URL pública utilizada por el navegador       |
| `DATABASE_URL`      | Sí        | Conexión PostgreSQL para ejecución local     |
| `POSTGRES_DB`       | Sí        | Base creada por el contenedor                |
| `POSTGRES_USER`     | Sí        | Usuario local de PostgreSQL                  |
| `POSTGRES_PASSWORD` | Sí        | Contraseña local, nunca versionada           |
| `JWT_SECRET`        | Sí        | Secreto de al menos 32 caracteres            |
| `LOG_LEVEL`         | No        | Nivel de logging; por defecto `info`         |
| `SWAGGER_ENABLED`   | No        | Habilita `/docs`; por defecto `true`         |

La API valida su configuración antes de comenzar a escuchar conexiones. `.env` está ignorado por
Git y `.env.example` contiene exclusivamente valores reemplazables para desarrollo.

## Comandos

Ejecuta los comandos desde la raíz:

| Comando             | Acción                                    |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Inicia API y web en modo desarrollo       |
| `pnpm build`        | Construye todos los workspaces            |
| `pnpm lint`         | Ejecuta análisis estático                 |
| `pnpm typecheck`    | Verifica TypeScript sin emitir archivos   |
| `pnpm test`         | Ejecuta pruebas y umbrales de cobertura   |
| `pnpm format`       | Formatea archivos compatibles             |
| `pnpm format:check` | Verifica formato sin modificar            |
| `pnpm compose:up`   | Construye e inicia todos los contenedores |
| `pnpm compose:down` | Detiene los contenedores                  |

Para las pruebas HTTP completas de la API:

```bash
pnpm --filter @faena/api test:e2e
```

## API disponible

### `GET /api/v1/health`

Comprueba que el proceso puede atender solicitudes:

```json
{
  "service": "panel-operativo-faena-api",
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "version": "0.1.0"
}
```

Los endpoints de lecturas, incidentes, órdenes y autenticación se incorporarán con sus contratos
Zod y ejemplos OpenAPI en los siguientes incrementos.

## Calidad y seguridad

- TypeScript está configurado en modo estricto y se prohíbe `any` explícito.
- Las variables se validan con Zod durante el arranque.
- La API habilita Helmet y CORS con orígenes configurables.
- Las imágenes ejecutan la API y el frontend con usuarios sin privilegios.
- CI verifica commits, formato, lint, tipos, pruebas, builds y Compose.
- Los hooks locales validan Conventional Commits y formatean los archivos preparados.
- No se versionan secretos, volúmenes, dependencias ni artefactos de build.

Consulta [`SECURITY.md`](SECURITY.md) para reportar vulnerabilidades.

## Estrategia de pruebas

La suite combinará:

- pruebas unitarias para rangos, incidentes y transiciones de órdenes;
- integración con PostgreSQL para constraints y transacciones;
- pruebas HTTP para validación, códigos REST, autenticación y roles;
- pruebas de componentes para carga, error, vacío y contenido.

Los ejemplos triviales generados por los frameworks fueron sustituidos por comprobaciones del
arranque, la configuración y la interfaz propia del proyecto.

## Ruta de construcción

- [x] Monorepo, configuración estricta y automatización.
- [x] API de salud y Swagger base.
- [x] Frontend base con React Query.
- [x] PostgreSQL y ejecución completa con Compose.
- [ ] Modelo relacional de siete tablas, migraciones y seed.
- [ ] Ingesta de lecturas y apertura de incidentes.
- [ ] Órdenes de trabajo y máquina de estados.
- [ ] Autenticación y roles.
- [ ] Pantallas operacionales y formularios.
- [ ] Suite de integración y extremo a extremo.
- [ ] Generador Python de lecturas, como mejora opcional.

## Contribución

El repositorio utiliza Conventional Commits:

```text
feat(db): add sensor and reading models
test(orders): reject invalid status transitions
docs(api): document authentication errors
```

Las ramas, alcances admitidos y definición de terminado están en
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licencia

No se ha definido una licencia de distribución. El código se mantiene como `UNLICENSED` hasta que
el propietario del repositorio elija una explícitamente.
