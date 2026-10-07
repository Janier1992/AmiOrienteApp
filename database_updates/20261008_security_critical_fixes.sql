-- =============================================================================
-- AmiOriente · Correcciones de seguridad CRÍTICAS  (2026-10-08)
-- Ejecutar en Supabase → SQL Editor. Idempotente y transaccional.
-- Detalle de los hallazgos: docs/AUDITORIA_SUPABASE_2026-10-07.md (A1–A4)
-- =============================================================================
-- Corrige:
--   A1  Cualquiera podía registrarse como administrador: handle_new_user tomaba
--       el rol de los metadatos que envía el propio cliente en signUp().
--   A2  Cualquier usuario podía volverse administrador editando su perfil
--       (la política de UPDATE no limitaba la columna `role`).
--   A3  Un cliente podía editar cualquier columna de su pedido (total, estado,
--       descuentos…) y crear pedidos ya "Entregado".
--   A4  accept_order() era SECURITY DEFINER sin validar quién la llama y estaba
--       abierta a `anon`: cualquiera podía forzar pedidos a "En curso".
--
-- Qué NO cambia: el funcionamiento normal de la app (registro de cliente /
-- tienda / domiciliario, edición de perfil, gestión de pedidos del negocio,
-- cancelación de un pedido propio, reservas de hotel, ventas POS).
--
-- Lo que se ejecuta como `postgres` / `service_role` (SQL Editor, funciones
-- SECURITY DEFINER, Edge Functions) NO se restringe: las protecciones aplican
-- solo a las peticiones de la API (roles `anon` y `authenticated`).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Verificaciones previas
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.profiles') IS NULL OR to_regclass('public.orders') IS NULL
       OR to_regclass('public.deliveries') IS NULL OR to_regclass('public.stores') IS NULL THEN
        RAISE EXCEPTION 'Faltan tablas base (profiles, orders, deliveries, stores). Esta migración es para el esquema de AmiOriente.';
    END IF;
    IF to_regprocedure('public.is_admin()') IS NULL THEN
        RAISE EXCEPTION 'No existe public.is_admin(): aplica antes 20261003_platform_admin.sql.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- A1. Registro: el rol solo puede ser cliente, tienda o domiciliario
--     (cualquier otro valor, incluido 'admin', se convierte en 'cliente').
-- -----------------------------------------------------------------------------
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
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'cliente');
  -- El rol llega en los metadatos que controla quien se registra: solo se
  -- aceptan los roles públicos. 'admin' se asigna únicamente a mano en la base.
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

-- -----------------------------------------------------------------------------
-- A2. Perfiles: nadie (salvo un admin) puede cambiar su rol ni su id
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    -- Solo las peticiones de la API (anon / authenticated); postgres y
    -- service_role (mantenimiento, funciones del servidor) pasan sin restricción.
    IF current_user IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'No tienes permiso para cambiar el rol de una cuenta.'
                USING ERRCODE = '42501';
        END IF;
        IF NEW.id IS DISTINCT FROM OLD.id THEN
            RAISE EXCEPTION 'No se puede cambiar el identificador de una cuenta.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_columns
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- La política además debe verificar la fila NUEVA (no solo la anterior).
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- A3. Pedidos: reglas por rol al crear y al modificar
--     · Dueño de la tienda: gestiona sus pedidos (estado, POS, reservas), pero no
--       puede cambiar de tienda ni de cliente un pedido existente.
--     · Cliente: al crear, solo en estado pendiente; después solo puede
--       CANCELAR su pedido mientras no esté en preparación. Nada más.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_orders_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid      uuid := auth.uid();
    v_is_owner boolean;
BEGIN
    IF current_user NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        SELECT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = NEW.store_id AND s.owner_id = v_uid)
          INTO v_is_owner;
        -- El dueño puede registrar ventas POS ya cerradas; un cliente solo pedidos nuevos.
        IF NOT v_is_owner AND NEW.status NOT IN ('Nuevo', 'Pendiente', 'Pendiente de pago en efectivo') THEN
            RAISE EXCEPTION 'Un pedido nuevo solo puede crearse en estado pendiente.'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    -- UPDATE
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.store_id IS DISTINCT FROM OLD.store_id
       OR NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
        RAISE EXCEPTION 'No se puede cambiar la tienda ni el cliente de un pedido.'
            USING ERRCODE = '42501';
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = OLD.store_id AND s.owner_id = v_uid)
      INTO v_is_owner;
    IF v_is_owner THEN
        RETURN NEW;
    END IF;

    -- Cliente
    IF OLD.customer_id IS DISTINCT FROM v_uid THEN
        RAISE EXCEPTION 'No tienes permiso para modificar este pedido.' USING ERRCODE = '42501';
    END IF;

    -- Compara TODAS las columnas (también las que se agreguen en el futuro) salvo el estado
    IF (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') THEN
        RAISE EXCEPTION 'Como cliente solo puedes cancelar tu pedido; no puedes modificar sus datos.'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NOT (NEW.status = 'Cancelado'
                AND OLD.status IN ('Nuevo', 'Pendiente', 'Pendiente de pago en efectivo', 'Confirmado')) THEN
            RAISE EXCEPTION 'Solo puedes cancelar un pedido que aún no está en preparación.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_orders_write ON public.orders;
CREATE TRIGGER trg_protect_orders_write
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.protect_orders_write();

-- -----------------------------------------------------------------------------
-- A4. accept_order: solo un domiciliario, a su nombre, sobre un pedido disponible
--     y sin quitarle la entrega a otro domiciliario.
-- -----------------------------------------------------------------------------
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

-- Solo usuarios con sesión pueden ejecutarla (en Supabase `anon` tiene EXECUTE explícito).
REVOKE ALL ON FUNCTION public.accept_order(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_order(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_order(uuid, uuid) TO authenticated;

COMMIT;

-- =============================================================================
-- Verificaciones posteriores (ejecútalas UNA POR UNA)
-- =============================================================================
-- 1) Debe devolver las 2 funciones nuevas y los 2 triggers
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
--  WHERE tgname IN ('trg_protect_profile_columns', 'trg_protect_orders_write');
--
-- 2) accept_order ya no debe ser ejecutable por anon (esperado: false)
-- SELECT has_function_privilege('anon', 'public.accept_order(uuid, uuid)', 'EXECUTE');
--
-- 3) REVISA tus cuentas: roles inesperados (puede haber admins creados por la vulnerabilidad)
-- SELECT id, email, role, created_at FROM public.profiles
--  WHERE role NOT IN ('cliente', 'tienda', 'domiciliario') ORDER BY created_at;
--  -- Debe aparecer SOLO tu cuenta de administrador. Si hay otras, investígalas.
