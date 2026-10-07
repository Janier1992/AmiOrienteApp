-- =============================================================================
-- AmiOriente · Migraciones del 2026-10-07  (ejecutar en Supabase → SQL Editor)
-- =============================================================================
-- Qué hace (todo es idempotente: se puede ejecutar más de una vez):
--   1) Lista de deseos del cliente: tabla `wishlist` + índice único + RLS
--      (cada usuario solo ve, agrega y quita lo suyo).
--   2) Un pedido solo puede tener UNA entrega activa (evita que dos
--      domiciliarios tomen el mismo pedido al aceptar a la vez).
--
-- Cómo usarlo:
--   · Pega TODO este archivo en el SQL Editor y pulsa "Run".
--   · Si algo no se cumple, el script se detiene con un mensaje claro y NO
--     deja cambios a medias (todo corre dentro de una transacción).
--   · Al final se muestran consultas de verificación.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Verificaciones previas
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.products') IS NULL THEN
        RAISE EXCEPTION 'No existe la tabla public.products: no se puede crear wishlist.';
    END IF;
    IF to_regclass('public.deliveries') IS NULL THEN
        RAISE EXCEPTION 'No existe la tabla public.deliveries: no se puede crear el índice de entregas.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Lista de deseos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía con otra forma, avisar ANTES de seguir.
DO $$
DECLARE
    faltantes TEXT;
BEGIN
    SELECT string_agg(c, ', ') INTO faltantes
    FROM unnest(ARRAY['id', 'user_id', 'product_id']) AS c
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'wishlist' AND column_name = c
    );
    IF faltantes IS NOT NULL THEN
        RAISE EXCEPTION 'La tabla public.wishlist ya existe pero le faltan las columnas: %. Avísame para ajustar la migración.', faltantes;
    END IF;
END $$;

-- Quitar duplicados (mismo usuario + mismo producto), conservando el más antiguo,
-- para poder crear el índice único.
DELETE FROM public.wishlist w
USING public.wishlist d
WHERE w.user_id = d.user_id
  AND w.product_id = d.product_id
  AND w.ctid > d.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_product_unique
    ON public.wishlist (user_id, product_id);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Permisos de la API: solo usuarios con sesión (nunca `anon`). La seguridad por fila
-- la dan las políticas de abajo; en Supabase esto suele venir por defecto, pero se
-- declara explícitamente para no depender de esa configuración.
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;

DROP POLICY IF EXISTS "Users view own wishlist" ON public.wishlist;
CREATE POLICY "Users view own wishlist"
    ON public.wishlist FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users add to own wishlist" ON public.wishlist;
CREATE POLICY "Users add to own wishlist"
    ON public.wishlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users remove from own wishlist" ON public.wishlist;
CREATE POLICY "Users remove from own wishlist"
    ON public.wishlist FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 2. Una sola entrega activa por pedido
-- -----------------------------------------------------------------------------
-- Si hoy ya hay pedidos con más de una entrega activa, el índice no se puede
-- crear: se detiene aquí y te muestra cuáles son.
DO $$
DECLARE
    duplicados TEXT;
BEGIN
    SELECT string_agg(order_id::text || ' (' || n || ' entregas)', ', ') INTO duplicados
    FROM (
        SELECT order_id, count(*) AS n
        FROM public.deliveries
        WHERE status <> 'Entregado'
        GROUP BY order_id
        HAVING count(*) > 1
    ) t;
    IF duplicados IS NOT NULL THEN
        RAISE EXCEPTION 'Hay pedidos con varias entregas activas: %. Resuélvelos (deja una entrega por pedido) y vuelve a ejecutar.', duplicados;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS deliveries_one_active_per_order
    ON public.deliveries (order_id)
    WHERE status <> 'Entregado';

COMMIT;

-- =============================================================================
-- Verificación (ejecuta estas consultas después; deben devolver filas)
-- =============================================================================
-- 1) Políticas de wishlist (esperadas: 3)
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'wishlist'
ORDER BY policyname;

-- 2) Índices creados (esperados: 2)
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('wishlist_user_product_unique', 'deliveries_one_active_per_order');

-- 3) RLS activo en wishlist (esperado: true)
SELECT relrowsecurity AS rls_activo
FROM pg_class
WHERE oid = 'public.wishlist'::regclass;
