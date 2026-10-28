-- =============================================================================
-- AmiOriente · ¿Qué migraciones ya están aplicadas? (solo lectura)
-- Pegar COMPLETO en Supabase → SQL Editor y ejecutar. No modifica nada.
-- Cada fila dice si lo que crea esa migración ya existe: true = aplicada.
-- =============================================================================
SELECT migracion, aplicada
FROM (
  VALUES
    (1, '20261008_security_critical_fixes (protecciones de pedidos y perfiles)',
        EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_orders_write')
        AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_protect_profile_columns')),
    (2, '20261008_delivery_status_rpc (update_delivery_status)',
        EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE n.nspname = 'public' AND p.proname = 'update_delivery_status')),
    (3, '20261009_teams_plans_commissions (equipos, planes, comisiones)',
        to_regclass('public.plans') IS NOT NULL
        AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                     WHERE n.nspname = 'public' AND p.proname = 'add_store_member')),
    (4, '20261010_legal_consents (autorizaciones)',
        to_regclass('public.legal_consents') IS NOT NULL),
    (5, '20261011_driver_declarations (declaración firmada)',
        to_regclass('public.driver_declarations') IS NOT NULL),
    (6, '20261012_accept_order_requires_declaration',
        COALESCE((SELECT pg_get_functiondef(p.oid) LIKE '%driver_declarations%'
                    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = 'public' AND p.proname = 'accept_order' LIMIT 1), false)),
    (7, '20261013_driver_photo (foto del domiciliario)',
        to_regclass('public.driver_photos') IS NOT NULL
        AND EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                     WHERE n.nspname = 'public' AND p.proname = 'get_order_driver')),
    (8, '20261014_cancel_order_and_realtime (cancelar y avisos en vivo)',
        EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE n.nspname = 'public' AND p.proname = 'cancel_order')
        AND EXISTS (SELECT 1 FROM pg_publication_tables
                     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'))
) AS t(orden, migracion, aplicada)
ORDER BY orden;
