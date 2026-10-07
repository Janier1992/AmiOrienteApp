# Scripts de Supabase

Se ejecutan en **Supabase → SQL Editor** (pega el archivo completo y pulsa *Run*).

| Orden | Archivo | Qué hace | ¿Modifica datos? |
|---|---|---|---|
| 1 | `01_aplicar_migraciones_20261007.sql` | Crea la lista de deseos (`wishlist`, con RLS) y el índice que impide que dos domiciliarios tomen el mismo pedido. | Sí (estructura). Idempotente y transaccional. |
| 2 | `02_auditoria_esquema.sql` | Devuelve un JSON con tablas, columnas, políticas RLS, funciones y triggers. | **No** (solo lectura). |

## Antes de ejecutar el 01
- Haz un respaldo si tienes datos reales (Supabase → *Database → Backups*).
- Si ya existen pedidos con más de una entrega activa, el script se detiene con un mensaje que indica cuáles son; no deja cambios a medias.
- Reemplaza a `database_updates/20261007_wishlist_policies.sql` y `database_updates/20261007_unique_active_delivery_per_order.sql` (mismo resultado, con verificaciones previas y permisos explícitos).

## Después
Ejecuta las 3 consultas de verificación del final del 01: deben devolver 3 políticas, 2 índices y `rls_activo = true`.

## Auditoría (02)
Copia la celda del resultado completo. Si el JSON es muy grande para pegarlo, guárdalo como archivo `.json` y compártelo. No contiene datos de usuarios, solo estructura.

## Cómo se probaron
Ambos scripts se ejecutaron contra PostgreSQL 16 con un esquema mínimo tipo Supabase: ejecución repetida, aislamiento por usuario con RLS, bloqueo de `anon`, duplicados rechazados, índice único de entregas y el caso de entregas duplicadas existentes. **No** se han ejecutado contra tu proyecto de Supabase.
