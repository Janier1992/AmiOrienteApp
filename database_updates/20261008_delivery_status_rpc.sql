-- =============================================================================
-- AmiOriente · Flujo del domiciliario: avanzar/cerrar una entrega (2026-10-08)
-- Ejecutar en Supabase → SQL Editor. Idempotente y transaccional.
-- =============================================================================
-- Problema: el domiciliario no tiene permiso (RLS ni triggers) para actualizar
-- `orders`, así que el cliente web marcaba la entrega como "Entregado" pero el
-- pedido nunca cambiaba de estado. Aquí se crea una función que valida quién
-- llama y mantiene entrega y pedido sincronizados en una sola transacción.
--
-- Complementa: 20261008_security_critical_fixes.sql (accept_order) y
-- 20261007_add_missing_timestamp_columns.sql.
-- =============================================================================

BEGIN;

ALTER TABLE public.deliveries
    ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
    ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Un pedido solo puede tener UNA entrega (evita que dos domiciliarios lo tomen).
-- Solo se crea si no existe ya una restricción/índice único sobre order_id.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_index i
         WHERE i.indrelid = 'public.deliveries'::regclass AND i.indisunique
           AND i.indnatts = 1
           AND (SELECT attname FROM pg_attribute WHERE attrelid = i.indrelid AND attnum = i.indkey[0]) = 'order_id'
    ) THEN
        CREATE UNIQUE INDEX deliveries_order_id_key ON public.deliveries (order_id);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_delivery_status(p_order_id uuid, p_status text)
RETURNS public.deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid      uuid := auth.uid();
    v_delivery public.deliveries%ROWTYPE;
    v_rank_old integer;
    v_rank_new integer;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión.' USING ERRCODE = '42501';
    END IF;

    v_rank_new := CASE p_status WHEN 'Asignado' THEN 1 WHEN 'Recogido' THEN 2
                                WHEN 'En camino' THEN 3 WHEN 'Entregado' THEN 4 END;
    IF v_rank_new IS NULL THEN
        RAISE EXCEPTION 'Estado de entrega inválido: %.', p_status;
    END IF;

    SELECT * INTO v_delivery FROM public.deliveries WHERE order_id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Este pedido no tiene una entrega asignada.' USING ERRCODE = 'P0002';
    END IF;
    IF v_delivery.delivery_person_id IS DISTINCT FROM v_uid AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Esta entrega no es tuya.' USING ERRCODE = '42501';
    END IF;

    v_rank_old := CASE v_delivery.status WHEN 'Asignado' THEN 1 WHEN 'Recogido' THEN 2
                                         WHEN 'En camino' THEN 3 WHEN 'Entregado' THEN 4 ELSE 0 END;
    IF v_rank_old = 4 THEN
        RAISE EXCEPTION 'Esta entrega ya fue completada.' USING ERRCODE = 'P0001';
    END IF;
    IF v_rank_new <= v_rank_old THEN
        RAISE EXCEPTION 'No se puede volver a un estado anterior de la entrega.' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.deliveries
       SET status = p_status,
           picked_up_at = CASE WHEN v_rank_new >= 2 THEN COALESCE(picked_up_at, now()) ELSE picked_up_at END,
           delivered_at = CASE WHEN v_rank_new = 4 THEN now() ELSE delivered_at END
     WHERE id = v_delivery.id
     RETURNING * INTO v_delivery;

    IF v_rank_new = 4 THEN
        UPDATE public.orders SET status = 'Entregado', updated_at = now() WHERE id = p_order_id;
    END IF;

    RETURN v_delivery;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_delivery_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_delivery_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_delivery_status(uuid, text) TO authenticated;

COMMIT;

-- Verificación (esperado: false):
-- SELECT has_function_privilege('anon', 'public.update_delivery_status(uuid, text)', 'EXECUTE');
