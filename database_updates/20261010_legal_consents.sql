-- =============================================================================
-- AmiOriente · Autorizaciones legales (Ley 1581 de 2012) (2026-10-10)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de las migraciones 20261007/08/09.
-- Idempotente y transaccional. Haz backup antes.
-- =============================================================================
-- Guarda la PRUEBA de que cada persona aceptó los Términos, la Política de
-- Privacidad y (domiciliarios) la declaración de trabajador independiente:
-- qué documento, qué versión y cuándo. El registro lo crea el servidor al
-- crear la cuenta, a partir de las casillas marcadas en el formulario; nadie
-- puede insertar ni modificar estos registros desde la API.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.legal_consents (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document    text NOT NULL CHECK (document IN ('terms', 'privacy', 'driver_independent')),
    version     text NOT NULL CHECK (char_length(version) BETWEEN 1 AND 30),
    accepted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS legal_consents_user_idx ON public.legal_consents (user_id);

ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own consents" ON public.legal_consents;
CREATE POLICY "Users can view their own consents" ON public.legal_consents
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
-- Sin políticas de escritura: solo el servidor (trigger de registro) inserta.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.legal_consents FROM anon, authenticated;
GRANT SELECT ON public.legal_consents TO authenticated;

-- Registro de usuarios: igual que antes (rol permitido solo cliente/tienda/domiciliario)
-- y, si el formulario trae las casillas marcadas, guarda las autorizaciones.
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

  -- Autorizaciones legales (prueba de aceptación). La versión viene del formulario;
  -- se acota para que no se pueda usar para guardar texto arbitrario.
  IF new.raw_user_meta_data->>'accepted_terms' = 'true' THEN
    v_version := left(COALESCE(NULLIF(new.raw_user_meta_data->>'legal_version', ''), 'sin-version'), 30);
    INSERT INTO public.legal_consents (user_id, document, version)
    VALUES (new.id, 'terms', v_version), (new.id, 'privacy', v_version);
    IF v_role = 'domiciliario' AND new.raw_user_meta_data->>'driver_independent_declared' = 'true' THEN
      INSERT INTO public.legal_consents (user_id, document, version)
      VALUES (new.id, 'driver_independent', v_version);
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

-- Verificación (esperado: las filas de las cuentas que se registren desde ahora con las casillas marcadas):
-- SELECT p.email, c.document, c.version, c.accepted_at
--   FROM public.legal_consents c JOIN public.profiles p ON p.id = c.user_id ORDER BY c.accepted_at DESC LIMIT 20;
