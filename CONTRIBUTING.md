# Contribuir

## Flujo de trabajo

1. Actualiza `main` y crea una rama corta desde ella.
2. Implementa una unidad de trabajo coherente.
3. Ejecuta `npm run format:check`, `npm run lint`, `npm run typecheck` y `npm test`.
4. Crea commits pequeños con Conventional Commits.
5. Abre un pull request y explica el problema, la solución y cómo se verificó.

No se debe forzar el push sobre `main`, reescribir historia compartida ni mezclar refactors
independientes con una funcionalidad.

## Conventional Commits

Formato:

```text
<tipo>(<alcance>): <descripción en imperativo>
```

Tipos frecuentes:

- `feat`: capacidad nueva.
- `fix`: corrección de un defecto.
- `test`: pruebas nuevas o corregidas.
- `refactor`: cambio interno sin alterar comportamiento.
- `docs`: documentación.
- `chore`: mantenimiento del repositorio.
- `ci`: automatización.

Alcances admitidos: `api`, `auth`, `ci`, `db`, `deps`, `docs`, `incidents`, `orders`, `repo`,
`sensors` y `web`.

Ejemplos:

```text
feat(sensors): persist out-of-range readings
test(orders): reject invalid status transitions
docs(repo): document local setup
```

Los hooks locales validan el formato y los archivos preparados. CI repite las comprobaciones para
que la calidad no dependa del entorno de una persona.

## Definición de terminado

Una funcionalidad está terminada cuando:

- sus entradas no confiables se validan;
- la lógica de negocio tiene pruebas significativas;
- no introduce `any` explícito ni secretos;
- los estados de error tienen una respuesta definida;
- la documentación afectada está actualizada;
- lint, tipos, pruebas y build están verdes.
