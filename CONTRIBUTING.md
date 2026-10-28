# Cómo contribuir a AmiOriente

Guía corta para que cualquier persona (o asistente) pueda cambiar el proyecto sin romper nada. Complementa el `README.md` y `docs/ESTADO_DEL_PROYECTO.md`.

## Flujo de trabajo
1. Trabaja siempre en una rama; nunca directamente en `main`.
2. Haz cambios pequeños y coherentes, con mensajes de commit que expliquen el porqué.
3. Antes de subir, ejecuta `npm run lint`, `npm test` y `npm run build` (y `bash tools/db-test/run.sh` si tocaste SQL).
4. Abre un pull request con la plantilla; el CI debe quedar en verde antes de fusionar. Se fusiona con «squash».

## Convenciones de código
- **Idioma:** comentarios y documentación en español. En código nuevo, los nombres del dominio van en español (`calcularTotalPedido`, `obtenerPlanDelNegocio`). **No se renombra en masa** lo existente (hay nombres en inglés como `getStores`); se respeta lo que ya hay en cada archivo.
- **Capas:** las pantallas (`src/pages`, `src/components`) no hablan con Supabase directamente si ya existe un servicio en `src/services`. Las reglas de negocio compartidas viven en `src/lib` (por ejemplo `orderRules.js`, `plural.js`). Las reglas que protegen dinero, permisos o datos viven **en la base de datos**, no en la pantalla.
- **Errores:** nunca se ocultan con `catch` vacíos. Un servicio que no puede consultar lanza el error; la pantalla distingue «falló» de «no hay datos» y ofrece «Reintentar». Los mensajes al usuario no revelan datos internos.
- **Estilo:** manda ESLint y `.editorconfig`. No se reformatean archivos que no se tocan.
- **Dependencias:** antes de agregar una, revisa que no exista algo equivalente en el stack, que esté mantenida y que no traiga alertas (`npm audit --omit=dev`). Las versiones mayores se planifican aparte.

## Pruebas
- Toda regla de negocio o servicio nuevo lleva pruebas (Vitest). Cubre el caso normal, las entradas inválidas y los errores.
- No se debilita una prueba para que pase; si una regla cambia, se explica en el pull request.
- Los cambios de interfaz críticos se prueban también con Testing Library (ver `src/pages/__tests__`).

## Base de datos (Supabase)
- Los cambios van como archivos nuevos en `database_updates/` con prefijo de fecha (`AAAAMMDD_descripcion.sql`); nunca se edita una migración que ya se aplicó.
- Cada migración es **idempotente** y transaccional (`BEGIN; … COMMIT;`), con una cabecera que explica qué hace, el orden y cómo verificarla.
- Toda función `SECURITY DEFINER` fija `search_path` y revoca el acceso a `PUBLIC`/`anon` salvo que deba ser pública.
- Se agrega una prueba en `tools/db-test/` (ataque bloqueado + flujo legítimo) y se registra la migración en `run.sh`.
- Se prueba primero en un proyecto de ensayo; al proyecto real solo se aplica lo ya probado, con copia de seguridad.
- El script `docs/supabase/03_verificar_migraciones.sql` indica cuáles están aplicadas.

## Seguridad y privacidad
- Ninguna clave, contraseña ni dato personal real en el código, los ejemplos, los registros ni los commits. La clave `service_role` jamás va en el frontend.
- Si se detecta una credencial expuesta: no se copia, se revoca o rota de inmediato y se avisa a la persona responsable.
- Los datos personales se minimizan (por ejemplo, el documento del domiciliario se muestra enmascarado).

## Documentación
Si el cambio altera el estado del proyecto, cómo se instala o cómo se opera, se actualiza `README.md` o `docs/` en el mismo pull request.
