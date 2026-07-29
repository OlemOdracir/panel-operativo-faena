# Arquitectura

## Decisión principal

El sistema es un monolito modular. NestJS concentra los casos de uso y las transacciones; React consume contratos JSON compartidos desde `packages/contracts`; PostgreSQL conserva el estado operacional.

```text
React + TanStack Query
          │ HTTP/JSON + cookies
          ▼
NestJS modular
  auth · catalog · readings · incidents · work-orders
          │ Prisma + transacciones
          ▼
PostgreSQL
```

## Modelo relacional

```text
areas 1──N sensors 1──N readings
                    │       └── 0..1 incident trigger
                    └──N incidents ──N work_orders
areas 1──N teams 1──N work_orders
users ── auditoría de incidentes y órdenes
```

Las siete tablas son `areas`, `sensors`, `readings`, `incidents`, `teams`, `users` y `work_orders`. Todas las FKs tienen índice. Los timestamps son UTC y cada lectura conserva `measured_at` y `received_at`. Los incidentes guardan severidad (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) calculada al abrirse.

## Flujo de ingesta

1. Zod valida `sensorId`, valor numérico finito y `measuredAt`.
2. La API busca el rango inclusivo del sensor.
3. La lectura se inserta en una transacción.
4. Si el valor está fuera de rango, se intenta abrir un incidente con `ON CONFLICT DO NOTHING`.
5. El índice parcial de PostgreSQL garantiza como máximo un incidente `OPEN` o `ACKNOWLEDGED` por sensor.
6. La respuesta informa la lectura y el incidente activo asociado.

Una lectura dentro del rango no resuelve incidentes; la resolución es una acción operacional explícita.

## Estados

- Incidente: `OPEN → ACKNOWLEDGED → RESOLVED`.
- Orden: `OPEN → ASSIGNED → IN_PROGRESS → CLOSED`.
- La asignación exige un equipo activo.
- Una orden cerrada no admite mutaciones posteriores.
- `incident_id` en una orden es opcional para permitir trabajo preventivo.

## Autenticación

La autenticación es global por defecto. Login y health son rutas públicas explícitas. El JWT breve vive en una cookie HttpOnly; el frontend nunca guarda credenciales en Web Storage. Las mutaciones requieren el token CSRF de doble envío y un origen permitido.

Supervisor gestiona incidentes y órdenes. Admin tiene además permiso para ingerir lecturas. La identidad usada en cada auditoría se obtiene de `request.user`, no de los cuerpos HTTP.

## Frontend

React Router organiza resumen, lista y detalle de incidentes, y tablero de órdenes. TanStack Query mantiene consultas y refetch moderado; las mutaciones invalidan las claves relacionadas. MUI 7 define el tema, tokens, layout responsive y componentes accesibles; Material React Table resuelve las grillas con paginación remota. Todas las consultas distinguen carga, error, vacío y contenido.

## Operación

Compose inicia PostgreSQL, aplica migraciones, ejecuta el seed idempotente y recién entonces inicia la API. El generador Python es opcional y solo usa `POST /readings`; la regla de incidentes permanece en NestJS.
