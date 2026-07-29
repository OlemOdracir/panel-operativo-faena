# ADR 0002: Sesión JWT en cookie HttpOnly

- Estado: aceptado
- Fecha: 2026-07-29

## Contexto

El navegador necesita una sesión que no exponga credenciales a JavaScript ni a `localStorage`, y las mutaciones deben resistir solicitudes cross-site.

## Decisión

La API emite un JWT de corta duración en una cookie `HttpOnly`, `SameSite=Strict` y `Secure` fuera de desarrollo. Las mutaciones requieren un token CSRF separado y validación de `Origin`. La identidad y el rol se derivan exclusivamente de la cookie validada.

## Consecuencias

El frontend no administra tokens persistentes y debe inicializar CSRF antes de mutar. En producción se exige HTTPS, un origen CORS explícito y rotación de secretos.
