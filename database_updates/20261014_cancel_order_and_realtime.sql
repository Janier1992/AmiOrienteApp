-- =============================================================================
-- AmiOriente · Cancelar pedidos con seguridad y avisos en vivo (2026-10-14)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de las migraciones anteriores.
-- Idempotente y transaccional. Haz backup antes.
-- =============================================================================
-- 1. cancel_order(): la forma segura de cancelar un pedido, para el CLIENTE y
--    para la TIENDA (dueño o equipo). Valida quién cancela y en qué estado,
--    devuelve las existencias al inventario UNA sola vez y registra fecha y motivo.
--    El cliente solo puede cancelar mientras el negocio no haya empezado a
--    prepararlo (Nuevo, Pendiente, Pendiente de pago en efectivo, Confirmado).
--    La tienda puede cancelar hasta antes de que lo recoja el domiciliario.
--    Una vez «En curso» o «Entregado» ya no se cancela por aquí.
-- 2. cancel_order_and_restock(): la función anterior no validaba nada y se podía
--    llamar varias veces inflando el inventario; ahora solo delega en cancel_order().
-- 3. Realtime: asegura que la tabla de pedidos publique sus cambios para que el
--    panel de la tienda reciba los pedidos nuevos al instante.
-- =============================================================================

BEGIN;

-- (ya existen si se aplicó 20261007_add_missing_timestamp_columns.sql; aquí por si acaso)
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid         uuid := auth.uid();
    v_order       public.orders%ROWTYPE;
    v_is_staff    boolean;
    v_is_customer boolean;
    v_is_admin    boolean;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para cancelar un pedido.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido no existe.' USING ERRCODE = 'P0002';
    END IF;

    v_is_customer := v_order.customer_id = v_uid;
    v_is_staff    := public.can_manage_store(v_order.store_id);
    v_is_admin    := public.is_admin();
    IF NOT (v_is_customer OR v_is_staff OR v_is_admin) THEN
        RAISE EXCEPTION 'No tienes permiso para cancelar este pedido.' USING ERRCODE = '42501';
    END IF;

    IF v_order.status = 'Cancelado' THEN
        RAISE EXCEPTION 'Este pedido ya fue cancelado.' USING ERRCODE = 'P0001';
    END IF;
    IF v_order.status IN ('En curso', 'Entregado') THEN
        RAISE EXCEPTION 'Este pedido ya salió o fue entregado: no se puede cancelar.' USING ERRCODE = 'P0001';
    END IF;
    IF NOT (v_is_staff OR v_is_admin)
       AND v_order.status NOT IN ('Nuevo', 'Pendiente', 'Pendiente de pago en efectivo', 'Confirmado') THEN
        RAISE EXCEPTION 'El negocio ya empezó a preparar tu pedido. Comunícate con el negocio para cancelarlo.' USING ERRCODE = 'P0001';
    END IF;

    -- Devuelve las existencias (una sola vez: el estado ya no puede ser Cancelado).
    UPDATE public.products p
       SET stock = p.stock + oi.qty
      FROM (SELECT product_id, sum(quantity) AS qty FROM public.order_items WHERE order_id = p_order_id GROUP BY product_id) oi
     WHERE p.id = oi.product_id;

    UPDATE public.orders
       SET status = 'Cancelado',
           cancelled_at = now(),
           cancellation_reason = NULLIF(left(btrim(COALESCE(p_reason, '')), 300), ''),
           updated_at = now()
     WHERE id = p_order_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancel_order(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid, text) TO authenticated;

-- La función anterior (sin validaciones, repetible) pasa a delegar en la nueva.
CREATE OR REPLACE FUNCTION public.cancel_order_and_restock(order_id_to_cancel uuid)
RETURNS void
LANGUAGE sql
AS $$ SELECT public.cancel_order(order_id_to_cancel, NULL); $$;
REVOKE ALL ON FUNCTION public.cancel_order_and_restock(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_and_restock(uuid) TO authenticated;

-- Pedidos nuevos en vivo: la tabla debe estar en la publicación de Realtime.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

COMMIT;

-- Verificaciones (de una en una):
-- SELECT has_function_privilege('anon','public.cancel_order(uuid,text)','EXECUTE');   -- false
-- SELECT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='orders');  -- true
