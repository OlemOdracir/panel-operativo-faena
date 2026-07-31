# Seguridad

## Reportar una vulnerabilidad

No publiques vulnerabilidades en issues abiertos. Usa el mecanismo privado de reporte de seguridad del repositorio e incluye impacto, pasos de reproducción y evidencia mínima.

## Controles implementados

- Variables de entorno para secretos; `.env` está ignorado y `.env.example` no contiene credenciales reales.
- Argon2id para contraseñas, mensajes genéricos de login, hash dummy para fallos y usuarios inactivos rechazados.
- Cookie de sesión HttpOnly/SameSite, expiración de 30 minutos y CSRF de doble token.
- Guard global de autenticación y guard de roles; las restricciones del frontend no son un control de seguridad.
- CORS explícito, Helmet, rate limiting, límite de body y PostgreSQL expuesto solo por loopback en desarrollo.
- Validación Zod estricta antes de persistencia; errores uniformes sin SQL ni stack traces.
- Logs estructurados con request-id entrante validado o generado, y redacción de cookies, tokens, contraseñas y hashes.
- Imágenes Docker ejecutadas como usuario no root.

## Producción

Termina TLS delante de la aplicación, activa `AUTH_COOKIE_SECURE=true`, rota `JWT_SECRET`, utiliza credenciales separadas para migración/aplicación y no ejecutes el seed de demostración.

Este repositorio es un caso de estudio; el despliegue real requiere revisión de infraestructura, gestión de secretos, backups y monitoreo.
