# ADR 0004: sistema visual MUI y grillas Material React Table

## Estado

Aceptado

## Contexto

El panel necesita navegación estable, formularios accesibles, filtros de fecha y grillas operacionales con paginación y ordenamiento remoto. El layout anterior combinaba CSS manual y Tailwind, lo que provocaba reglas repetidas y desplazamientos visuales al cambiar el número de filas.

## Decisión

El frontend utilizará MUI 7 como sistema de componentes y tema visual de Faena. Material React Table 3 será la única grilla para incidentes y órdenes, con estado controlado por TanStack Query y filtros, paginación y ordenamiento ejecutados en la API. MUI X Date Pickers con Day.js manejará rangos de fechas y localización en español.

El shell usará `Drawer` persistente con mini-variante en escritorio y `Drawer` temporal en móvil. El Dashboard seguirá siendo ejecutivo; las herramientas de filtrado y el detalle operacional vivirán en sus páginas de recurso.

Tailwind se retiró del pipeline para conservar una sola fuente de tokens, espaciado, tipografía, foco y estados visuales.

## Consecuencias

- Se reducen estilos artesanales y se obtiene una base consistente y accesible.
- El bundle inicial aumenta por MUI, Emotion y MRT; se mitigará con imports por módulo y división futura de rutas.
- Los contratos de listados deben validar fechas, columnas ordenables y nuevos filtros antes de consultar Prisma.
- MRT no sustituye reglas de dominio: las acciones de estado y asignación continúan siendo mutaciones API protegidas.
