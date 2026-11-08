-- =============================================================================
-- AmiOriente · Botón «Llamar» del domiciliario y privacidad de la ubicación (2026-10-17)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de las migraciones anteriores.
-- Idempotente (se puede ejecutar más de una vez). Sin BEGIN/COMMIT ni ELSE/ELSIF:
-- el editor de Supabase no los admite bien.
-- =============================================================================
-- Hallazgos (consultados en el proyecto real):
--  · profiles no tiene política para domiciliarios, así que «Llamar» nunca recibía el
--    teléfono del cliente y salía deshabilitado.
--  · delivery_locations: el cliente solo ve la posición mientras su pedido está «En curso»
--    (bien), pero la última posición del domiciliario se quedaba guardada para siempre y
--    anon tenía permisos de tabla (la seguridad por filas lo bloqueaba, pero sobraban).
--
-- Cambios:
--  1. get_order_customer_contact(): el domiciliario asignado, y solo mientras el pedido está
--     «En curso», recibe el nombre de pila y el teléfono del cliente. No se abre `profiles`.
--  2. Se retiran los permisos de anon sobre delivery_locations.
--  3. La posición del domiciliario se borra al entregarse o cancelarse el pedido, y una
--     limpieza cada hora borra la de quien no tenga entregas en curso.
-- =============================================================================

DO $$
BEGIN
    IF to_regclass('public.delivery_locations') IS NULL OR to_regclass('public.deliveries') IS NULL THEN
        RAISE EXCEPTION 'Faltan las tablas delivery_locations/deliveries.';
    END IF;
END $$;

-- 1. Contacto del cliente para el domiciliario asignado.
CREATE OR REPLACE FUNCTION public.get_order_customer_contact(p_order_id uuid)
RETURNS TABLE (first_name text, phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión.' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT split_part(btrim(COALESCE(p.full_name, '')), ' ', 1), p.phone
      FROM public.orders o
      JOIN public.deliveries d ON d.order_id = o.id
      JOIN public.profiles p ON p.id = o.customer_id
     WHERE o.id = p_order_id
       AND o.status = 'En curso'
       AND d.delivery_person_id = auth.uid();
END;
$function$;
REVOKE ALL ON FUNCTION public.get_order_customer_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_order_customer_contact(uuid) TO authenticated;

-- 2. anon no necesita tocar la ubicación de nadie.
REVOKE ALL ON public.delivery_locations FROM anon;

-- 3. Borrar la posición cuando ya no hay entrega en curso.
CREATE OR REPLACE FUNCTION public.clear_idle_driver_locations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_deleted integer;
BEGIN
    DELETE FROM public.delivery_locations l
     WHERE NOT EXISTS (
         SELECT 1 FROM public.deliveries d
           JOIN public.orders o ON o.id = d.order_id
          WHERE d.delivery_person_id = l.delivery_person_id AND o.status = 'En curso');
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$function$;
REVOKE ALL ON FUNCTION public.clear_idle_driver_locations() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_clear_driver_location_on_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.delivery_locations l
     WHERE l.delivery_person_id IN (SELECT d.delivery_person_id FROM public.deliveries d WHERE d.order_id = NEW.id)
       AND NOT EXISTS (
           SELECT 1 FROM public.deliveries d2
             JOIN public.orders o2 ON o2.id = d2.order_id
            WHERE d2.delivery_person_id = l.delivery_person_id AND o2.status = 'En curso');
    RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.trg_clear_driver_location_on_close() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_clear_driver_location ON public.orders;
CREATE TRIGGER trg_clear_driver_location
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    WHEN (NEW.status IN ('Entregado', 'Cancelado') AND OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.trg_clear_driver_location_on_close();

-- Limpieza cada hora (red de seguridad: por ejemplo, si el domiciliario cierra la app a mitad de la entrega).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE 'pg_cron no está activa: habilítala y vuelve a ejecutar este script para programar la limpieza horaria.';
        RETURN;
    END IF;
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'clear-idle-driver-locations';
    PERFORM cron.schedule('clear-idle-driver-locations', '5 * * * *', 'SELECT public.clear_idle_driver_locations()');
END $$;

-- Limpieza inicial: borra las posiciones viejas que ya estaban guardadas.
SELECT public.clear_idle_driver_locations();

-- Verificaciones (de una en una):
-- SELECT has_function_privilege('anon','public.get_order_customer_contact(uuid)','EXECUTE');   -- false
-- SELECT has_table_privilege('anon','public.delivery_locations','SELECT');                     -- false
-- SELECT count(*) FROM public.delivery_locations;                                              -- solo domiciliarios con entrega en curso
-- SELECT jobname, schedule FROM cron.job WHERE jobname='clear-idle-driver-locations';          -- 1 fila
