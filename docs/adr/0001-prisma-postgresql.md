# ADR 0001: Prisma sobre PostgreSQL

- Estado: aceptado
- Fecha: 2026-07-29

## Contexto

El panel necesita relaciones fuertes entre sensores, lecturas, incidentes y órdenes, además de migraciones reproducibles y restricciones que protejan reglas críticas.

## Decisión

Usamos PostgreSQL como fuente transaccional y Prisma como cliente tipado. Las migraciones son versionadas y el cliente se genera desde `schema.prisma`. Las invariantes que deben sobrevivir a concurrencia, como un incidente activo por sensor, también se expresan como índices o constraints SQL.

## Consecuencias

El esquema es revisable antes de ejecutar la aplicación y las consultas se benefician de tipos generados. La API debe ejecutar `prisma generate` después de cambiar el modelo y las migraciones deben aplicarse antes del seed.
