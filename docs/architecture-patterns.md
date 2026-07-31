# Patrones de arquitectura

El proyecto usa una versión pragmática de Presentation-Domain-Data Layering dentro de un monolito modular orientado por dominios:

```text
Presentación (React / Controllers)
              ↓
Aplicación (casos de uso y coordinación)
              ↓
Dominio (reglas puras y máquinas de estado)
              ↓
Puertos de persistencia
              ↓
Infraestructura (Prisma / PostgreSQL)
```

Las reglas de transición de incidentes y órdenes viven en módulos `domain/` sin depender de NestJS ni Prisma. Las claves de TanStack Query están agrupadas por feature (`auth`, `incidents`, `work-orders` y `catalog`) para evitar cadenas duplicadas en los componentes.

La separación es deliberadamente ligera: no se incorpora CQRS, Event Sourcing ni una capa de repositorios artificial donde Prisma ya expresa correctamente la operación. Si la persistencia creciera en complejidad, el siguiente paso sería introducir puertos y adaptadores concretos por agregado.
