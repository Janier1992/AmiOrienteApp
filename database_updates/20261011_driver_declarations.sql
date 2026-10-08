-- =============================================================================
-- AmiOriente · Declaración firmada del domiciliario independiente (2026-10-11)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de las migraciones anteriores
-- (incluida 20261010_legal_consents.sql). Idempotente y transaccional.
-- =============================================================================
-- Guarda, como soporte para administración, el documento que firma cada
-- domiciliario al registrarse: sus datos (documento, vehículo, licencia, SOAT,
-- técnico-mecánica, afiliaciones), el TEXTO EXACTO que firmó, su firma
-- (imagen), la fecha, la versión de los Términos y una huella (hash SHA-256)
-- del conjunto para detectar cualquier alteración.
--
-- · El registro es INMODIFICABLE: nadie puede actualizar ni borrar filas desde
--   la API (solo se «reclama» al crear la cuenta).
-- · Solo lo ven el administrador de la plataforma y el propio domiciliario.
-- · Flujo: el formulario envía la declaración ANTES de crear la cuenta
--   (submit_driver_declaration, sin sesión) y recibe un identificador; al crear
--   la cuenta, handle_new_user la vincula si ese identificador y el correo
--   coinciden. Un domiciliario ya registrado la firma desde su panel (con
--   sesión) y queda vinculada de inmediato.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.driver_declarations (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- se conserva como soporte aunque se cierre la cuenta
    email          text NOT NULL,
    full_name      text NOT NULL,
    document_type  text NOT NULL,
    document_number text NOT NULL,
    payload        jsonb NOT NULL,          -- datos declarados (vehículo, licencia, SOAT, afiliaciones…)
    document_text  text NOT NULL,           -- texto exacto que firmó
    signature_png  text NOT NULL,           -- firma dibujada (data URL PNG)
    document_hash  text NOT NULL,           -- SHA-256 de texto + datos + firma
    legal_version  text NOT NULL,
    signed_at      timestamptz NOT NULL DEFAULT now(),
    claimed_at     timestamptz
);
CREATE INDEX IF NOT EXISTS driver_declarations_user_idx  ON public.driver_declarations (user_id);
CREATE INDEX IF NOT EXISTS driver_declarations_email_idx ON public.driver_declarations (lower(email));
CREATE INDEX IF NOT EXISTS driver_declarations_signed_idx ON public.driver_declarations (signed_at DESC);

ALTER TABLE public.driver_declarations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Drivers and admins can view declarations" ON public.driver_declarations;
CREATE POLICY "Drivers and admins can view declarations" ON public.driver_declarations
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
REVOKE ALL ON public.driver_declarations FROM anon, authenticated;
GRANT SELECT ON public.driver_declarations TO authenticated;

-- Firmar y enviar la declaración (con o sin sesión).
CREATE OR REPLACE FUNCTION public.submit_driver_declaration(
    p_email text,
    p_full_name text,
    p_document_type text,
    p_document_number text,
    p_payload jsonb,
    p_document_text text,
    p_signature_png text,
    p_legal_version text
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

    -- Tope global de declaraciones sin vincular (evita que se llene la base con envíos sin cuenta).
    IF v_uid IS NULL THEN
        SELECT count(*) INTO v_pending FROM public.driver_declarations WHERE user_id IS NULL AND claimed_at IS NULL;
        IF v_pending >= 3000 THEN
            RAISE EXCEPTION 'No se pudo registrar la declaración en este momento. Inténtalo más tarde.' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    INSERT INTO public.driver_declarations
        (id, user_id, email, full_name, document_type, document_number, payload, document_text,
         signature_png, document_hash, legal_version, claimed_at)
    VALUES
        (v_id, v_uid, v_email, btrim(p_full_name), btrim(p_document_type), btrim(p_document_number), p_payload,
         p_document_text, p_signature_png,
         encode(sha256(convert_to(p_document_text || '|' || p_payload::text || '|' || p_signature_png || '|' || p_legal_version, 'UTF8')), 'hex'),
         p_legal_version, CASE WHEN v_uid IS NOT NULL THEN now() END);

    RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_driver_declaration(text, text, text, text, jsonb, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_driver_declaration(text, text, text, text, jsonb, text, text, text) TO anon, authenticated;

-- Registro de usuarios: igual que antes + vincula la declaración firmada del domiciliario.
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

COMMIT;

-- Verificaciones (de una en una):
-- SELECT to_regclass('public.driver_declarations') IS NOT NULL;
-- SELECT has_function_privilege('anon','public.submit_driver_declaration(text,text,text,text,jsonb,text,text,text)','EXECUTE');  -- true (firma antes de tener cuenta)
-- Declaraciones firmadas (solo las ve el administrador):
-- SELECT full_name, document_type, document_number, email, signed_at, claimed_at IS NOT NULL AS vinculada FROM public.driver_declarations ORDER BY signed_at DESC LIMIT 20;
