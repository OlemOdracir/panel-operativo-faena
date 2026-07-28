# Arquitectura

## Decisión principal

El sistema se implementará como un **monolito modular**. El tamaño y los límites del problema no
justifican microservicios; mantener API, reglas y transacciones en un proceso reduce complejidad sin
impedir separar responsabilidades por dominio.

```text
Navegador
   │
   ▼
React + TanStack Query
   │ HTTP/JSON
   ▼
NestJS
   ├── auth
   ├── readings
   ├── incidents
   ├── work-orders
   └── catalog
         │
         ▼
     PostgreSQL
```

## Organización

- `apps/api`: adaptador HTTP, casos de uso, reglas de negocio y persistencia.
- `apps/web`: interfaz organizada por capacidades, no por tipo técnico global.
- `docs`: decisiones e invariantes que no son evidentes al leer una sola clase.

Cada módulo de negocio de la API debe mantener controladores delgados. Los controladores validan y
traducen HTTP; los servicios coordinan casos de uso; las funciones de dominio deciden si una
operación es válida.

## Modelo previsto

El núcleo relacional tendrá siete tablas:

1. `areas`
2. `sensors`
3. `readings`
4. `incidents`
5. `teams`
6. `users`
7. `work_orders`

Todas las relaciones tendrán claves foráneas y los índices necesarios en el lado referenciante. Las
lecturas conservarán `measured_at` y `received_at` para no confundir el tiempo del sensor con el de
ingesta.

## Invariantes previstas

- El rango válido del sensor es inclusivo.
- Una lectura fuera del rango abre un incidente dentro de la misma transacción.
- Un sensor no puede tener más de un incidente activo.
- Las órdenes avanzan `OPEN → ASSIGNED → IN_PROGRESS → CLOSED`.
- Una orden asignada debe tener equipo.
- Una orden cerrada no vuelve a modificarse.
- La identidad de las acciones se obtiene de la sesión autenticada, nunca del body.

Estas reglas se convertirán en constraints cuando sea posible y en código de dominio con pruebas
cuando dependan de una transición.

## Seguridad

La API aplicará autenticación por defecto y declarará explícitamente las rutas públicas. Las
contraseñas se almacenarán con un algoritmo adaptativo; los tokens serán de vida limitada; los
errores externos no expondrán stacks ni detalles SQL. La configuración se valida durante el
arranque para fallar antes de aceptar tráfico.
