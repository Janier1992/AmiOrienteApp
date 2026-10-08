-- =============================================================================
-- AmiOriente · Fotografía del domiciliario visible para el cliente (2026-10-13)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de 20261012_accept_order_requires_declaration.sql.
-- Idempotente y transaccional. Haz backup antes.
-- =============================================================================
-- Regla: todo domiciliario se toma una fotografía al registrarse. Esa foto, su
-- nombre, el tipo y los últimos 4 dígitos de su documento y la placa se muestran
-- al CLIENTE de cada pedido que atienda (y solo a él, a la tienda del pedido y a
-- administración), para que sepa quién va en camino y pueda seguirlo.
--
--  · Minimización de datos (Ley 1581 de 2012): el número de documento se enmascara
--    (solo los últimos 4 dígitos; en números cortos, solo la mitad final). Para mostrarlo completo habría que cambiar
--    get_order_driver; no se recomienda sin concepto jurídico.
--  · La foto (dato biométrico/sensible) se trata con autorización expresa, que va
--    como declaración en el documento que firma el domiciliario.
--  · La foto se guarda en la declaración firmada (soporte inmodificable) y en
--    driver_photos (la que se muestra; el domiciliario puede actualizarla).
--  · accept_order exige declaración Y foto.
--  · submit_driver_declaration (sin foto) se conserva para no romper el registro
--    mientras se despliega la nueva pantalla; no puede dejar a nadie operando porque
--    sin foto accept_order rechaza. Cuando el sitio nuevo esté desplegado se puede
--    eliminar (ver el final del archivo).
-- =============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.driver_declarations') IS NULL THEN
        RAISE EXCEPTION 'Falta driver_declarations: aplica antes 20261011_driver_declarations.sql.';
    END IF;
END $$;

ALTER TABLE public.driver_declarations ADD COLUMN IF NOT EXISTS photo_jpeg text;

CREATE TABLE IF NOT EXISTS public.driver_photos (
    user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_jpeg text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers and admins can view their photo" ON public.driver_photos;
CREATE POLICY "Drivers and admins can view their photo" ON public.driver_photos
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
-- Sin políticas de escritura: solo las funciones de abajo escriben. Los clientes ven la foto
-- únicamente a través de get_order_driver (pedidos suyos con domiciliario asignado).
REVOKE ALL ON public.driver_photos FROM anon, authenticated;
GRANT SELECT ON public.driver_photos TO authenticated;

-- Una foto válida: JPEG en base64, de tamaño razonable.
CREATE OR REPLACE FUNCTION public.is_valid_driver_photo(p_photo text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
    SELECT p_photo IS NOT NULL
       AND p_photo ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$'
       AND char_length(p_photo) BETWEEN 2000 AND 250000;
$$;

-- Firmar la declaración + foto (con o sin sesión).
CREATE OR REPLACE FUNCTION public.submit_driver_declaration_v2(
    p_email text,
    p_full_name text,
    p_document_type text,
    p_document_number text,
    p_payload jsonb,
    p_document_text text,
    p_signature_png text,
    p_legal_version text,
    p_photo_jpeg text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid     uuid := auth.uid();
    v_email   text := lower(btrim(p_email));
    v_id      uuid := gen_random_uuid();
    v_pending bigint;
BEGIN
    -- Con sesión: debe ser un domiciliario y solo firma a su nombre.
    IF v_uid IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND role = 'domiciliario') THEN
            RAISE EXCEPTION 'Solo un domiciliario puede firmar esta declaración.' USING ERRCODE = '42501';
        END IF;
        SELECT lower(email) INTO v_email FROM public.profiles WHERE id = v_uid;
    END IF;

    IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(v_email) > 200 THEN
        RAISE EXCEPTION 'Correo inválido.';
    END IF;
    IF btrim(COALESCE(p_full_name, '')) = '' OR char_length(p_full_name) > 200 THEN
        RAISE EXCEPTION 'Escribe tu nombre completo.';
    END IF;
    IF btrim(COALESCE(p_document_type, '')) = '' OR char_length(p_document_type) > 20
       OR btrim(COALESCE(p_document_number, '')) = '' OR char_length(p_document_number) > 30 THEN
        RAISE EXCEPTION 'Completa el tipo y número de documento.';
    END IF;
    IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR octet_length(p_payload::text) > 12000 THEN
        RAISE EXCEPTION 'Datos de la declaración inválidos.';
    END IF;
    IF p_document_text IS NULL OR char_length(p_document_text) < 200 OR char_length(p_document_text) > 30000 THEN
        RAISE EXCEPTION 'El texto del documento es inválido.';
    END IF;
    IF p_signature_png IS NULL OR p_signature_png !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'
       OR char_length(p_signature_png) < 300 OR char_length(p_signature_png) > 120000 THEN
        RAISE EXCEPTION 'Firma inválida: dibuja tu firma en el recuadro.';
    END IF;
    IF p_legal_version IS NULL OR char_length(p_legal_version) NOT BETWEEN 1 AND 30 THEN
        RAISE EXCEPTION 'Versión inválida.';
    END IF;
    IF NOT public.is_valid_driver_photo(p_photo_jpeg) THEN
        RAISE EXCEPTION 'Foto inválida: tómate una foto con la cámara.';
    END IF;

    -- Tope global de declaraciones sin vincular (evita que se llene la base con envíos sin cuenta).
    IF v_uid IS NULL THEN
        SELECT count(*) INTO v_pending FROM public.driver_declarations WHERE user_id IS NULL AND claimed_at IS NULL;
        IF v_pending >= 3000 THEN
            RAISE EXCEPTION 'No se pudo registrar la declaración en este momento. Inténtalo más tarde.' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    INSERT INTO public.driver_declarations
        (id, user_id, email, full_name, document_type, document_number, payload, document_text,
         signature_png, document_hash, legal_version, claimed_at, photo_jpeg)
    VALUES
        (v_id, v_uid, v_email, btrim(p_full_name), btrim(p_document_type), btrim(p_document_number), p_payload,
         p_document_text, p_signature_png,
         encode(sha256(convert_to(p_document_text || '|' || p_payload::text || '|' || p_signature_png || '|' || p_legal_version || '|' || p_photo_jpeg, 'UTF8')), 'hex'),
         p_legal_version, CASE WHEN v_uid IS NOT NULL THEN now() END, p_photo_jpeg);

    -- Con sesión (domiciliario ya registrado): la foto queda visible para sus clientes de inmediato.
    IF v_uid IS NOT NULL THEN
        INSERT INTO public.driver_photos (user_id, photo_jpeg) VALUES (v_uid, p_photo_jpeg)
        ON CONFLICT (user_id) DO UPDATE SET photo_jpeg = EXCLUDED.photo_jpeg, updated_at = now();
    END IF;

    RETURN v_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.submit_driver_declaration_v2(text, text, text, text, jsonb, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_driver_declaration_v2(text, text, text, text, jsonb, text, text, text, text) TO anon, authenticated;

-- Cambiar o agregar la foto (domiciliario con sesión: por ejemplo, quien se registró antes de esta regla).
CREATE OR REPLACE FUNCTION public.update_driver_photo(p_photo_jpeg text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND role = 'domiciliario') THEN
        RAISE EXCEPTION 'Solo un domiciliario puede actualizar su fotografía.' USING ERRCODE = '42501';
    END IF;
    IF NOT public.is_valid_driver_photo(p_photo_jpeg) THEN
        RAISE EXCEPTION 'Foto inválida: tómate una foto con la cámara.';
    END IF;
    INSERT INTO public.driver_photos (user_id, photo_jpeg) VALUES (v_uid, p_photo_jpeg)
    ON CONFLICT (user_id) DO UPDATE SET photo_jpeg = EXCLUDED.photo_jpeg, updated_at = now();
END;
$function$;
REVOKE ALL ON FUNCTION public.update_driver_photo(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_driver_photo(text) TO authenticated;

-- Quién va a entregar mi pedido: nombre, foto, placa y documento enmascarado.
-- Lo puede ver el cliente del pedido, la tienda del pedido (dueño o equipo) y administración.
CREATE OR REPLACE FUNCTION public.get_order_driver(p_order_id uuid)
RETURNS TABLE (full_name text, photo_jpeg text, plate text, vehicle_type text, document_masked text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_order  public.orders%ROWTYPE;
    v_driver uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión.' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND OR NOT (v_order.customer_id = auth.uid() OR public.can_manage_store(v_order.store_id) OR public.is_admin()) THEN
        RAISE EXCEPTION 'No tienes acceso a este pedido.' USING ERRCODE = '42501';
    END IF;

    SELECT d.delivery_person_id INTO v_driver FROM public.deliveries d WHERE d.order_id = p_order_id;
    IF v_driver IS NULL THEN
        RETURN;  -- todavía no hay domiciliario asignado
    END IF;

    RETURN QUERY
    SELECT COALESCE(dd.full_name, pr.full_name),
           ph.photo_jpeg,
           dd.payload->>'plate',
           dd.payload->>'vehicleType',
           -- Si no hay documento, la concatenación con NULL da NULL (no hace falta CASE).
           dd.document_type || ' ' || repeat('*', char_length(dd.document_number) - least(4, char_length(dd.document_number) / 2)) || right(dd.document_number, least(4, char_length(dd.document_number) / 2))
      FROM public.profiles pr
      LEFT JOIN public.driver_photos ph ON ph.user_id = pr.id
      LEFT JOIN LATERAL (
            SELECT x.* FROM public.driver_declarations x WHERE x.user_id = pr.id ORDER BY x.signed_at DESC LIMIT 1
      ) dd ON true
     WHERE pr.id = v_driver;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_order_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_order_driver(uuid) TO authenticated;

-- Registro de usuarios: igual que antes, y la foto de la declaración pasa a driver_photos.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_service_category_id UUID;
    v_role TEXT;
    v_service_category_name TEXT;
    v_category TEXT;
    v_version TEXT;
    v_decl TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'cliente');
  IF v_role NOT IN ('cliente', 'tienda', 'domiciliario') THEN
    v_role := 'cliente';
  END IF;
  v_category := new.raw_user_meta_data->>'category';

  INSERT INTO public.profiles (id, full_name, role, phone, address, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    v_role,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.email
  );

  -- Autorizaciones legales (prueba de aceptación).
  IF new.raw_user_meta_data->>'accepted_terms' = 'true' THEN
    v_version := left(COALESCE(NULLIF(new.raw_user_meta_data->>'legal_version', ''), 'sin-version'), 30);
    INSERT INTO public.legal_consents (user_id, document, version)
    VALUES (new.id, 'terms', v_version), (new.id, 'privacy', v_version);
    IF v_role = 'domiciliario' AND new.raw_user_meta_data->>'driver_independent_declared' = 'true' THEN
      INSERT INTO public.legal_consents (user_id, document, version)
      VALUES (new.id, 'driver_independent', v_version);
    END IF;
  END IF;

  -- Declaración firmada del domiciliario: se vincula solo si el identificador Y el correo coinciden.
  IF v_role = 'domiciliario' THEN
    v_decl := new.raw_user_meta_data->>'declaration_id';
    IF v_decl ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      UPDATE public.driver_declarations
         SET user_id = new.id, claimed_at = now()
       WHERE id = v_decl::uuid AND user_id IS NULL AND lower(email) = lower(new.email);
      -- La foto de la declaración pasa a ser la foto visible para los clientes.
      INSERT INTO public.driver_photos (user_id, photo_jpeg)
      SELECT new.id, photo_jpeg FROM public.driver_declarations
       WHERE id = v_decl::uuid AND user_id = new.id AND photo_jpeg IS NOT NULL
      ON CONFLICT (user_id) DO UPDATE SET photo_jpeg = EXCLUDED.photo_jpeg, updated_at = now();
    END IF;
  END IF;

  IF v_role = 'tienda' THEN
    v_service_category_name := new.raw_user_meta_data->>'service_category';

    IF v_service_category_name IS NOT NULL THEN
        SELECT id INTO v_service_category_id
        FROM public.service_categories
        WHERE name = v_service_category_name;
    END IF;

    IF v_service_category_id IS NULL THEN
        SELECT id INTO v_service_category_id
        FROM public.service_categories
        WHERE name = 'Domicilios'
        LIMIT 1;
    END IF;

    INSERT INTO public.stores (owner_id, name, service_category_id, address, cuisine_type, star_rating, activity_type, interest_type, category)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'store_name',
        v_service_category_id,
        new.raw_user_meta_data->>'address',
        new.raw_user_meta_data->>'cuisine_type',
        NULLIF(new.raw_user_meta_data->>'star_rating', '')::INT,
        new.raw_user_meta_data->>'activity_type',
        new.raw_user_meta_data->>'interest_type',
        v_category
    );
  END IF;

  RETURN new;
END;
$function$;

-- accept_order: declaración firmada Y fotografía.
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
    -- Sin la fotografía de perfil (la ve el cliente de cada pedido) tampoco.
    IF NOT EXISTS (SELECT 1 FROM public.driver_photos WHERE user_id = delivery_person_id_to_assign) THEN
        RAISE EXCEPTION 'Debes tomarte la fotografía de tu perfil antes de aceptar pedidos.'
            USING ERRCODE = 'P0001', HINT = 'foto_pendiente';
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

-- Verificaciones (de una en una):
-- SELECT to_regclass('public.driver_photos') IS NOT NULL;                                   -- true
-- SELECT has_function_privilege('anon','public.get_order_driver(uuid)','EXECUTE');          -- false
-- Domiciliarios con cuenta que aún NO tienen foto (deberán tomársela en su panel):
-- SELECT p.email FROM public.profiles p WHERE p.role='domiciliario' AND NOT EXISTS (SELECT 1 FROM public.driver_photos f WHERE f.user_id=p.id);

-- ---------------------------------------------------------------------------------------------
-- LIMPIEZA OPCIONAL (ejecutar solo cuando el sitio nuevo ya esté desplegado y nadie use el viejo):
-- DROP FUNCTION IF EXISTS public.submit_driver_declaration(text, text, text, text, jsonb, text, text, text);
-- ---------------------------------------------------------------------------------------------
