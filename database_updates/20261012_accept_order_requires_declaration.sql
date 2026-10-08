-- =============================================================================
-- AmiOriente · accept_order exige la declaración firmada del domiciliario (2026-10-12)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de 20261011_driver_declarations.sql.
-- Idempotente y transaccional. Haz backup antes.
-- =============================================================================
-- Hasta ahora la exigencia de firmar la declaración estaba solo en la interfaz.
-- Con este cambio la base de datos rechaza aceptar un pedido si el domiciliario
-- no tiene una declaración firmada, aunque alguien llame a la función directamente.
-- Todo lo demás de accept_order queda igual que en 20261008_security_critical_fixes.sql.
--
-- ⚠️ Los domiciliarios que ya existían deben firmar la declaración desde su
-- panel (les aparece un aviso) antes de volver a aceptar pedidos.
-- =============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.driver_declarations') IS NULL THEN
        RAISE EXCEPTION 'Falta la tabla driver_declarations: aplica antes 20261011_driver_declarations.sql.';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.accept_order(order_id_to_accept uuid, delivery_person_id_to_assign uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid     uuid := auth.uid();
    v_order   record;
    v_rows    integer;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para aceptar un pedido.' USING ERRCODE = '42501';
    END IF;
    IF v_uid <> delivery_person_id_to_assign AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Solo puedes aceptar pedidos a tu propio nombre.' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = delivery_person_id_to_assign AND role = 'domiciliario') THEN
        RAISE EXCEPTION 'Solo un domiciliario puede aceptar pedidos.' USING ERRCODE = '42501';
    END IF;
    -- Sin la declaración firmada (independencia, documentos al día, afiliación) no se aceptan pedidos.
    IF NOT EXISTS (SELECT 1 FROM public.driver_declarations WHERE user_id = delivery_person_id_to_assign) THEN
        RAISE EXCEPTION 'Debes firmar tu declaración de domiciliario independiente antes de aceptar pedidos.'
            USING ERRCODE = 'P0001', HINT = 'declaracion_pendiente';
    END IF;

    SELECT o.id, o.status, o.delivery_address, o.delivery_lat, o.delivery_lng, s.address AS store_address
      INTO v_order
      FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
     WHERE o.id = order_id_to_accept
       FOR UPDATE OF o;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido no existe.' USING ERRCODE = 'P0002';
    END IF;
    IF v_order.status NOT IN ('Pendiente', 'Pendiente de pago en efectivo', 'Listo para recogida') THEN
        RAISE EXCEPTION 'Este pedido ya no está disponible.' USING ERRCODE = 'P0001';
    END IF;

    -- Solo se reclama si no tiene domiciliario (o ya es de quien lo pide).
    INSERT INTO public.deliveries (order_id, delivery_person_id, status, delivery_address, pickup_address, delivery_coords)
    VALUES (
        order_id_to_accept,
        delivery_person_id_to_assign,
        'Asignado',
        COALESCE(v_order.delivery_address, 'Sin dirección'),
        v_order.store_address,
        CASE WHEN v_order.delivery_lat IS NOT NULL AND v_order.delivery_lng IS NOT NULL
             THEN ARRAY[v_order.delivery_lat, v_order.delivery_lng]::real[] END
    )
    ON CONFLICT (order_id) DO UPDATE
        SET delivery_person_id = EXCLUDED.delivery_person_id,
            status = 'Asignado'
        WHERE public.deliveries.delivery_person_id IS NULL
           OR public.deliveries.delivery_person_id = EXCLUDED.delivery_person_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RAISE EXCEPTION 'Este pedido ya fue tomado por otro domiciliario.' USING ERRCODE = '23505';
    END IF;

    UPDATE public.orders SET status = 'En curso' WHERE id = order_id_to_accept;
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_order(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_order(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_order(uuid, uuid) TO authenticated;

COMMIT;

-- Verificación (esperado: true) — la función ahora menciona la declaración:
-- SELECT pg_get_functiondef('public.accept_order(uuid, uuid)'::regprocedure) LIKE '%driver_declarations%';
-- Domiciliarios con cuenta que aún NO han firmado (deberán firmar en su panel):
-- SELECT p.email, p.created_at FROM public.profiles p
--  WHERE p.role = 'domiciliario' AND NOT EXISTS (SELECT 1 FROM public.driver_declarations d WHERE d.user_id = p.id);
