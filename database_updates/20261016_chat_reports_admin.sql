-- =============================================================================
-- AmiOriente · Pantalla del administrador para los reportes del chat (2026-10-16)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de 20261015_order_chat.sql.
-- Idempotente (se puede ejecutar más de una vez). Sin BEGIN/COMMIT: el editor de
-- Supabase no los admite y ya ejecuta el script completo como una sola operación.
-- =============================================================================
-- · admin_list_order_chat_reports(): lista los reportes con el contexto del pedido
--   (quién reportó, negocio, cliente, domiciliario, cuántos mensajes). Solo administrador.
-- · resolve_order_chat_report(): cierra un reporte con una nota. Solo administrador.
--   Al resolverlo, el administrador deja de poder leer esa conversación (la política
--   solo lo permite mientras haya un reporte abierto) y, pasados 30 días del pedido,
--   la purga diaria la elimina.
-- La lectura de los mensajes sigue pasando por la política de order_messages.
-- =============================================================================

DO $$
BEGIN
    IF to_regclass('public.order_chat_reports') IS NULL THEN
        RAISE EXCEPTION 'Falta order_chat_reports: aplica antes 20261015_order_chat.sql.';
    END IF;
END $$;

ALTER TABLE public.order_chat_reports
    ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS resolution_note text CHECK (resolution_note IS NULL OR char_length(resolution_note) <= 500);

CREATE OR REPLACE FUNCTION public.admin_list_order_chat_reports(p_only_open boolean DEFAULT true)
RETURNS TABLE (
    id uuid,
    order_id uuid,
    reason text,
    created_at timestamptz,
    resolved_at timestamptz,
    resolution_note text,
    reporter_name text,
    reporter_role text,
    store_name text,
    order_status text,
    customer_name text,
    driver_name text,
    message_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Solo el administrador puede ver los reportes.' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT r.id, r.order_id, r.reason, r.created_at, r.resolved_at, r.resolution_note,
           rp.full_name, rp.role, s.name, o.status, cp.full_name, dp.full_name,
           (SELECT count(*) FROM public.order_messages m WHERE m.order_id = r.order_id)
      FROM public.order_chat_reports r
      JOIN public.orders o ON o.id = r.order_id
      LEFT JOIN public.stores s ON s.id = o.store_id
      LEFT JOIN public.profiles rp ON rp.id = r.reporter_id
      LEFT JOIN public.profiles cp ON cp.id = o.customer_id
      LEFT JOIN public.deliveries d ON d.order_id = o.id
      LEFT JOIN public.profiles dp ON dp.id = d.delivery_person_id
     WHERE (NOT p_only_open) OR r.resolved_at IS NULL
     ORDER BY (r.resolved_at IS NOT NULL), r.created_at DESC
     LIMIT 200;
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_list_order_chat_reports(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_order_chat_reports(boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_order_chat_report(p_report_id uuid, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Solo el administrador puede resolver reportes.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.order_chat_reports
       SET resolved_at = now(),
           resolved_by = auth.uid(),
           resolution_note = NULLIF(left(btrim(COALESCE(p_note, '')), 500), '')
     WHERE id = p_report_id AND resolved_at IS NULL;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El reporte no existe o ya fue resuelto.' USING ERRCODE = 'P0002';
    END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.resolve_order_chat_report(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_order_chat_report(uuid, text) TO authenticated;

-- Verificaciones (de una en una):
-- SELECT has_function_privilege('anon','public.admin_list_order_chat_reports(boolean)','EXECUTE');   -- false
-- SELECT has_function_privilege('authenticated','public.resolve_order_chat_report(uuid,text)','EXECUTE');  -- true
