# Modelo de amenazas

## Activos

- Datos de sensores, incidentes y órdenes de trabajo.
- Credenciales y roles de operadores.
- Disponibilidad y trazabilidad de la API.

## Límites de confianza

El navegador y el generador son clientes no confiables. La API es el límite de autorización y PostgreSQL se alcanza únicamente desde la red interna de Compose. La base se publica en `127.0.0.1` solo para desarrollo.

## Amenazas y controles

| Amenaza                        | Control                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| Robo de sesión                 | Cookie HttpOnly, SameSite, Secure en producción, expiración de 30 minutos y logout |
| CSRF en mutaciones             | Doble token CSRF y validación estricta de Origin                                   |
| Escalada de privilegios        | Guard global JWT + roles; admin es el único rol que ingesta lecturas               |
| Inyección o campos inesperados | Schemas Zod estrictos antes de persistencia y Prisma parametrizado                 |
| Fuerza bruta de login          | Rate limit global y mensajes de error genéricos                                    |
| Fuga de secretos               | Variables de entorno, redacción de cookies/tokens en logs y `.env` ignorado        |
| Pérdida de trazabilidad        | `X-Request-Id` propagado y logs JSON estructurados                                 |
| Duplicación concurrente        | Índice único parcial y transacción de lectura/incidente                            |

## Riesgos residuales

El entorno local usa HTTP y credenciales configurables de demostración. En producción deben usarse TLS terminado antes de la API, un gestor de secretos, rotación de JWT y una base privada sin exposición pública.
