# Seguridad

## Reportar una vulnerabilidad

No publiques vulnerabilidades en un issue abierto. Utiliza la opción **Security → Report a
vulnerability** del repositorio para enviar un reporte privado con los pasos de reproducción y el
impacto observado.

## Prácticas del repositorio

- Los secretos se suministran mediante variables de entorno y nunca se versionan.
- `.env.example` contiene solamente nombres y valores locales reemplazables.
- Toda entrada HTTP deberá validarse antes de acceder a persistencia.
- La autenticación y autorización se aplicarán en la API; las restricciones visuales no se
  consideran un control de seguridad.
- Los logs no deben incluir contraseñas, tokens, hashes ni cuerpos sensibles.

Este es un caso de estudio y no representa actualmente un servicio desplegado en producción.
