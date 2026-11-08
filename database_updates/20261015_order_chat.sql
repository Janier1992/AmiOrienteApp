-- =============================================================================
-- AmiOriente · Chat interno cliente ↔ domiciliario por pedido (2026-10-15)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de las migraciones anteriores.
-- Idempotente y transaccional. Haz backup antes.
-- =============================================================================
-- Reglas:
--  · Cada pedido tiene su propio chat entre el cliente y el domiciliario que lo aceptó.
--  · Solo se puede ESCRIBIR mientras el pedido está «En curso». Al entregarse o
--    cancelarse, el chat queda de solo lectura (archivado).
--  · Se conserva 30 días después del cierre del pedido y luego se borra (Ley 1581:
--    finalidad y conservación limitada). Plazo sugerido: que lo valide el abogado.
--  · Nadie escribe directo en la tabla: solo send_order_message(), que valida quién
--    escribe, el estado del pedido, el largo (1–500) y la frecuencia (5 por 10 s).
--  · La tienda no ve el chat. El administrador solo lo ve si alguna de las partes
--    REPORTÓ la conversación (report_order_chat) y únicamente para atender ese reporte.
--  · El domiciliario deja de necesitar el teléfono del cliente (y viceversa).
-- =============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.deliveries') IS NULL OR to_regclass('public.orders') IS NULL THEN
        RAISE EXCEPTION 'Faltan las tablas orders/deliveries.';
    END IF;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.order_messages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role text NOT NULL CHECK (sender_role IN ('cliente', 'domiciliario')),
    body        text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
    created_at  timestamptz NOT NULL DEFAULT now(),
    read_at     timestamptz
);
CREATE INDEX IF NOT EXISTS order_messages_order_created_idx ON public.order_messages (order_id, created_at);

CREATE TABLE IF NOT EXISTS public.order_chat_reports (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason      text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
    created_at  timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS order_chat_reports_order_idx ON public.order_chat_reports (order_id);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_chat_reports ENABLE ROW LEVEL SECURITY;

-- Nadie escribe directo: solo las funciones de abajo (SECURITY DEFINER).
REVOKE ALL ON public.order_messages FROM anon, authenticated;
REVOKE ALL ON public.order_chat_reports FROM anon, authenticated;
GRANT SELECT ON public.order_messages TO authenticated;
GRANT SELECT ON public.order_chat_reports TO authenticated;

-- ¿Participa el usuario actual en el chat de este pedido? (cliente o domiciliario asignado)
-- SECURITY DEFINER para no disparar las políticas de orders/deliveries desde la política del chat.
CREATE OR REPLACE FUNCTION public.is_order_chat_participant(p_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id AND o.customer_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.deliveries d WHERE d.order_id = p_order_id AND d.delivery_person_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_order_chat_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_order_chat_participant(uuid) TO authenticated;

DROP POLICY IF EXISTS "Participants read their order chat" ON public.order_messages;
CREATE POLICY "Participants read their order chat" ON public.order_messages
    FOR SELECT TO authenticated
    USING (public.is_order_chat_participant(order_id));

DROP POLICY IF EXISTS "Admins read reported order chats" ON public.order_messages;
CREATE POLICY "Admins read reported order chats" ON public.order_messages
    FOR SELECT TO authenticated
    USING (public.is_admin() AND EXISTS (
        SELECT 1 FROM public.order_chat_reports r WHERE r.order_id = order_messages.order_id AND r.resolved_at IS NULL));

DROP POLICY IF EXISTS "Reporters and admins read chat reports" ON public.order_chat_reports;
CREATE POLICY "Reporters and admins read chat reports" ON public.order_chat_reports
    FOR SELECT TO authenticated
    USING (reporter_id = auth.uid() OR public.is_admin());

-- Enviar un mensaje.
CREATE OR REPLACE FUNCTION public.send_order_message(p_order_id uuid, p_body text)
RETURNS public.order_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid    uuid := auth.uid();
    v_order  public.orders%ROWTYPE;
    v_driver uuid;
    v_role   text;
    v_body   text := btrim(COALESCE(p_body, ''));
    v_row    public.order_messages;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para enviar mensajes.' USING ERRCODE = '42501';
    END IF;
    IF v_body = '' THEN
        RAISE EXCEPTION 'Escribe un mensaje.' USING ERRCODE = '22023';
    END IF;
    IF char_length(v_body) > 500 THEN
        RAISE EXCEPTION 'El mensaje es demasiado largo (máximo 500 caracteres).' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido no existe.' USING ERRCODE = 'P0002';
    END IF;
    SELECT delivery_person_id INTO v_driver FROM public.deliveries WHERE order_id = p_order_id;

    IF v_order.customer_id = v_uid THEN
        v_role := 'cliente';
    END IF;
    IF v_role IS NULL AND v_driver IS NOT NULL AND v_driver = v_uid THEN
        v_role := 'domiciliario';
    END IF;
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'No participas en este pedido.' USING ERRCODE = '42501';
    END IF;

    IF v_order.status <> 'En curso' THEN
        RAISE EXCEPTION 'El chat solo está disponible mientras el pedido va en camino.' USING ERRCODE = 'P0001';
    END IF;

    IF (SELECT count(*) FROM public.order_messages
         WHERE order_id = p_order_id AND sender_id = v_uid AND created_at > now() - interval '10 seconds') >= 5 THEN
        RAISE EXCEPTION 'Estás enviando mensajes muy rápido. Espera unos segundos.' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.order_messages (order_id, sender_id, sender_role, body)
    VALUES (p_order_id, v_uid, v_role, v_body)
    RETURNING * INTO v_row;
    RETURN v_row;
END;
$function$;
REVOKE ALL ON FUNCTION public.send_order_message(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_order_message(uuid, text) TO authenticated;

-- Marcar como leídos los mensajes de la otra parte.
CREATE OR REPLACE FUNCTION public.mark_order_messages_read(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_order_chat_participant(p_order_id) THEN
        RAISE EXCEPTION 'No participas en este pedido.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.order_messages
       SET read_at = now()
     WHERE order_id = p_order_id AND sender_id <> auth.uid() AND read_at IS NULL;
END;
$function$;
REVOKE ALL ON FUNCTION public.mark_order_messages_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_order_messages_read(uuid) TO authenticated;

-- Reportar la conversación (habilita al administrador a leerla para atender el reporte).
CREATE OR REPLACE FUNCTION public.report_order_chat(p_order_id uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_reason text := left(btrim(COALESCE(p_reason, '')), 500);
    v_id     uuid;
BEGIN
    IF auth.uid() IS NULL OR NOT public.is_order_chat_participant(p_order_id) THEN
        RAISE EXCEPTION 'No participas en este pedido.' USING ERRCODE = '42501';
    END IF;
    IF v_reason = '' THEN
        RAISE EXCEPTION 'Cuéntanos qué pasó.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.order_chat_reports (order_id, reporter_id, reason)
    VALUES (p_order_id, auth.uid(), v_reason)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.report_order_chat(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_order_chat(uuid, text) TO authenticated;

-- Conservación: borra los chats de pedidos cerrados hace más de 30 días.
-- Los chats con un reporte sin resolver se conservan hasta resolverlo.
CREATE OR REPLACE FUNCTION public.purge_old_order_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.order_messages m
     USING public.orders o
     WHERE o.id = m.order_id
       AND o.status IN ('Entregado', 'Cancelado')
       AND COALESCE(o.updated_at, o.cancelled_at, o.created_at) < now() - interval '30 days'
       AND NOT EXISTS (SELECT 1 FROM public.order_chat_reports r WHERE r.order_id = m.order_id AND r.resolved_at IS NULL);
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$function$;
REVOKE ALL ON FUNCTION public.purge_old_order_messages() FROM PUBLIC, anon, authenticated;

-- Tiempo real para el chat (las políticas de arriba también rigen en Realtime).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'order_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
    END IF;
END $$;

-- Borrado diario automático, si la extensión pg_cron está disponible (Supabase: Database → Extensions).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE 'pg_cron no está activa: habilítala y vuelve a ejecutar este script para programar el borrado a los 30 días.';
        RETURN;
    END IF;
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'purge-order-messages';
    PERFORM cron.schedule('purge-order-messages', '30 7 * * *', 'SELECT public.purge_old_order_messages()');
END $$;

COMMIT;

-- Verificaciones (de una en una):
-- SELECT has_function_privilege('anon','public.send_order_message(uuid,text)','EXECUTE');       -- false
-- SELECT has_table_privilege('authenticated','public.order_messages','INSERT');                  -- false
-- SELECT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='order_messages');  -- true
-- SELECT jobname, schedule FROM cron.job WHERE jobname='purge-order-messages';                  -- 1 fila (si pg_cron está activa)
