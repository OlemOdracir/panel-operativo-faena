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

## Paleta y tokens visuales

`apps/web/src/app/tokens.ts` es la única fuente de hexadecimales. El tema de MUI los consume y los componentes leen el tema: ningún componente escribe un color literal. `index.css` solo ajusta el renderizado de texto.

Los valores se verificaron por medición, no a ojo:

| Rol                         | Valor                                   | Medición                                                                                      |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| Tinta primaria / secundaria | `#e6e9ee` / `#98a2b3`                   | 14.2:1 y 6.7:1 sobre la superficie elevada                                                    |
| Marca                       | `#3987e5`                               | 4.75:1; el relleno lleva tinta oscura `#0b1017` (5.24:1) porque el blanco solo alcanza 3.64:1 |
| Escala de estado (`mark`)   | `#199e70` `#c98500` `#d95926` `#d03b3b` | dentro de la banda de luminosidad oscura (L 0.48–0.67) y ≥3:1 contra toda superficie          |
| Escala de estado (`text`)   | `#3fbf7f` `#e2a93f` `#ef8f5c` `#f0757e` | ≥4.5:1 sobre el fondo tonal compuesto del chip (peor caso 4.94:1)                             |

Dos decisiones que conviene no revertir sin medir de nuevo:

- **La severidad es una escala ordinal de estado, no categórica.** `HIGH` tiene su propio paso (naranja) en lugar de compartir el rojo de `CRITICAL`. Antes el chip pintaba `HIGH` de rojo mientras el medidor de distribución lo pintaba azul: dos fuentes de color para el mismo dato. Ahora ambos leen `severityTone()`.
- **El color nunca viaja solo.** Una progresión verde→ámbar→naranja→rojo de cuatro pasos no alcanza el umbral de separación para daltonismo —ninguna escala de severidad de cuatro pasos lo hace, incluidas las de referencia—, así que cada chip y cada barra van siempre acompañados de su etiqueta de texto, que es el canal primario.

El rojo queda reservado a la severidad crítica: los estados de flujo usan neutro (`OPEN`), ámbar (`ACKNOWLEDGED`, `ASSIGNED`), azul (`IN_PROGRESS`) y verde (`RESOLVED`, `CLOSED`).

`<CssBaseline />` debe permanecer montado en `providers.tsx`: sin él, el bloque `MuiCssBaseline` del tema no se emite y el árbol hereda `content-box`, con lo que cualquier caja con `width: 100%` más padding desborda el ancho de la ventana.

## Operación

Compose inicia PostgreSQL, aplica migraciones, ejecuta el seed idempotente y recién entonces inicia la API. El generador Python es opcional y solo usa `POST /readings`; la regla de incidentes permanece en NestJS.
