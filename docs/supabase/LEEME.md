# Scripts de Supabase

Se ejecutan en **Supabase → SQL Editor** (pega el archivo completo y pulsa *Run*).

| Archivo | Qué hace | ¿Modifica datos? |
|---|---|---|
| `02_auditoria_esquema.sql` | Devuelve una fila por sección (tablas, columnas, políticas RLS, funciones, triggers…) en JSON. | **No** (solo lectura). |

## Importante: no hay migraciones pendientes de la entrega anterior
Una primera versión de este directorio traía un `01_aplicar_migraciones_20261007.sql` (lista de deseos
e índice único de entregas). **Se eliminó**: la auditoría real de la base mostró que ya existen
`wishlist` (con política RLS e índice único `wishlist_user_id_product_id_key`) y
`deliveries_order_id_key` (una entrega por pedido). No ejecutes nada de eso.

Los hallazgos reales de seguridad y los desajustes entre el código y la base están en
`docs/AUDITORIA_SUPABASE_2026-10-07.md`.

## Cómo repetir la auditoría
1. Pega `02_auditoria_esquema.sql` en el SQL Editor y pulsa *Run*.
2. En los resultados usa *Copy → Copy as JSON* (o descarga el CSV). No contiene datos de usuarios.
3. Para actualizar el verificador de consultas del código, vuelca la sección `columnas` en
   `tools/schema-check/schema.py` y ejecuta `python3 tools/schema-check/check.py`.
