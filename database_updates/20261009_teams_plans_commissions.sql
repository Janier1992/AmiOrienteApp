-- =============================================================================
-- AmiOriente · Equipos de trabajo, planes y comisiones por plan (2026-10-09)
-- Ejecutar en Supabase → SQL Editor DESPUÉS de las migraciones 20261007_* y
-- 20261008_*. Idempotente y transaccional. Haz backup antes.
-- =============================================================================
-- Qué hace
--  1. Tabla `plans`: ÚNICA fuente de verdad de precios, comisión y límite de
--     equipo. Cambiar un precio o una comisión = un UPDATE aquí (ver el final).
--  2. `subscriptions.plan_id` queda ligada a `plans` (y todo negocio tiene una).
--  3. Equipos: un negocio puede tener miembros (roles 'admin' y 'editor') que
--     operan pedidos/productos sin ser el dueño. Se gestionan SOLO mediante
--     funciones (invitar por correo, cambiar rol, quitar) que validan permisos
--     y el límite del plan; la tabla ya no se puede escribir directo.
--  4. La comisión de cada venta sale del plan del negocio (antes estaba fija en
--     22 % dentro de un trigger). Queda guardada en cada transacción, así que
--     cambiar de plan no altera el historial.
--  5. El administrador de la plataforma cambia el plan con `admin_set_store_plan`
--     (mientras no haya pagos en línea, el cambio de plan es manual).
-- =============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.store_members') IS NULL OR to_regclass('public.subscriptions') IS NULL
       OR to_regclass('public.stores') IS NULL OR to_regclass('public.orders') IS NULL THEN
        RAISE EXCEPTION 'Faltan tablas base (stores, store_members, subscriptions, orders).';
    END IF;
    IF to_regprocedure('public.is_admin()') IS NULL THEN
        RAISE EXCEPTION 'No existe public.is_admin(): aplica antes 20261003_platform_admin.sql.';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Planes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
    id                  text PRIMARY KEY,
    name                text    NOT NULL,
    description         text,
    price_cop           numeric NOT NULL DEFAULT 0 CHECK (price_cop >= 0),        -- por mes; 0 = gratis
    commission_percent  numeric NOT NULL DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 100),
    max_team_members    integer CHECK (max_team_members IS NULL OR max_team_members >= 1),  -- NULL = ilimitado (incluye al dueño)
    features            jsonb   NOT NULL DEFAULT '[]'::jsonb,
    is_public           boolean NOT NULL DEFAULT true,   -- visible en la página de precios
    sort_order          integer NOT NULL DEFAULT 0
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view public plans" ON public.plans;
CREATE POLICY "Anyone can view public plans" ON public.plans FOR SELECT USING (is_public);
-- Sin políticas de escritura: solo postgres / service_role (SQL Editor) los modifican.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.plans FROM anon, authenticated;
GRANT SELECT ON public.plans TO anon, authenticated;

-- Valores iniciales (DECISIÓN DE NEGOCIO, ajustable con un UPDATE; no se pisan
-- si ya existen). Base: modelo híbrido del README (comisión baja o suscripción).
INSERT INTO public.plans (id, name, description, price_cop, commission_percent, max_team_members, features, sort_order) VALUES
 ('basic', 'Básico',
  'Para empezar a vender sin costo fijo: pagas solo cuando vendes.',
  0, 10, 2,
  '["Productos y pedidos ilimitados","Panel de control del negocio","Equipo de hasta 2 personas (tú y 1 colaborador)","Pagos en efectivo y transferencia"]'::jsonb, 1),
 ('pro', 'Profesional',
  'Para negocios con ventas constantes: sin comisión por venta.',
  59900, 0, 10, 
  '["Todo lo del plan Básico","0 % de comisión por venta","Equipo de hasta 10 personas","Posicionamiento destacado en la app","Soporte prioritario"]'::jsonb, 2),
 ('enterprise', 'Empresarial',
  'Para operaciones grandes o con necesidades a medida. Se acuerda con ventas.',
  0, 0, NULL,
  '["Todo lo del plan Profesional","Equipo ilimitado","Condiciones y comisiones a convenir","Gerente de cuenta dedicado"]'::jsonb, 3)
ON CONFLICT (id) DO NOTHING;
-- El plan Empresarial no se contrata solo: se ve en precios pero lo asigna el admin.

-- Toda suscripción debe apuntar a un plan existente.
UPDATE public.subscriptions SET plan_id = 'basic'
 WHERE plan_id IS NULL OR plan_id NOT IN (SELECT id FROM public.plans);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_id_fkey') THEN
        ALTER TABLE public.subscriptions
            ADD CONSTRAINT subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id);
    END IF;
END $$;

-- Todo negocio tiene suscripción y su dueño figura como miembro 'admin'
-- (los negocios creados antes de los triggers pueden no tenerlo).
INSERT INTO public.subscriptions (store_id, plan_id, status)
SELECT s.id, 'basic', 'active' FROM public.stores s
 WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions x WHERE x.store_id = s.id);

INSERT INTO public.store_members (store_id, user_id, role)
SELECT s.id, s.owner_id, 'admin' FROM public.stores s
 WHERE s.owner_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.store_members m WHERE m.store_id = s.id AND m.user_id = s.owner_id);

-- -----------------------------------------------------------------------------
-- 2. Permisos: ¿puede la persona operar este negocio? (dueño o miembro)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_store(p_store_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT auth.uid() IS NOT NULL AND (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.store_members m WHERE m.store_id = p_store_id AND m.user_id = auth.uid())
    );
$$;

-- ¿Puede administrar el equipo? (dueño o miembro con rol 'admin')
CREATE OR REPLACE FUNCTION public.can_admin_store_team(p_store_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT auth.uid() IS NOT NULL AND (
        EXISTS (SELECT 1 FROM public.stores s WHERE s.id = p_store_id AND s.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.store_members m
                    WHERE m.store_id = p_store_id AND m.user_id = auth.uid() AND m.role = 'admin')
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_store(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_admin_store_team(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_admin_store_team(uuid) TO authenticated;

-- Políticas ADICIONALES (se suman a las del dueño, no las reemplazan) para que
-- los miembros del equipo operen el negocio: pedidos, productos, mesas, habitaciones.
DO $$
DECLARE
    t record;
BEGIN
    -- (tabla, comando, nombre) con acceso por store_id directo
    FOR t IN SELECT * FROM (VALUES
        ('products',          'INSERT', 'Store staff can create products'),
        ('products',          'UPDATE', 'Store staff can update products'),
        ('products',          'DELETE', 'Store staff can delete products'),
        ('orders',            'SELECT', 'Store staff can view orders'),
        ('orders',            'UPDATE', 'Store staff can update orders'),
        ('orders',            'INSERT', 'Store staff can create POS orders'),
        ('hotel_rooms',       'ALL',    'Store staff can manage hotel rooms'),
        ('restaurant_tables', 'ALL',    'Store staff can manage restaurant tables')
    ) AS v(tbl, cmd, pol)
    LOOP
        CONTINUE WHEN to_regclass('public.' || t.tbl) IS NULL;
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t.pol, t.tbl);
        IF t.cmd = 'INSERT' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_manage_store(store_id))', t.pol, t.tbl);
        ELSIF t.cmd = 'ALL' THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.can_manage_store(store_id)) WITH CHECK (public.can_manage_store(store_id))', t.pol, t.tbl);
        ELSE
            EXECUTE format('CREATE POLICY %I ON public.%I FOR %s TO authenticated USING (public.can_manage_store(store_id))', t.pol, t.tbl, t.cmd);
        END IF;
    END LOOP;
END $$;

-- order_items: el acceso pasa por el pedido
DROP POLICY IF EXISTS "Store staff can view order items" ON public.order_items;
CREATE POLICY "Store staff can view order items" ON public.order_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.can_manage_store(o.store_id)));
DROP POLICY IF EXISTS "Store staff can insert order items" ON public.order_items;
CREATE POLICY "Store staff can insert order items" ON public.order_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.can_manage_store(o.store_id)));

-- El equipo también ve los datos de los clientes de su negocio.
CREATE OR REPLACE FUNCTION public.is_customer_of_my_store(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.orders o
         WHERE o.customer_id = p_profile_id AND public.can_manage_store(o.store_id)
    );
$$;

-- El trigger de pedidos (A3) trata al equipo igual que al dueño.
CREATE OR REPLACE FUNCTION public.protect_orders_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_uid     uuid := auth.uid();
    v_is_staff boolean;
BEGIN
    IF current_user NOT IN ('anon', 'authenticated') OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_is_staff := public.can_manage_store(NEW.store_id);
        IF NOT v_is_staff AND NEW.status NOT IN ('Nuevo', 'Pendiente', 'Pendiente de pago en efectivo') THEN
            RAISE EXCEPTION 'Un pedido nuevo solo puede crearse en estado pendiente.'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.store_id IS DISTINCT FROM OLD.store_id
       OR NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
        RAISE EXCEPTION 'No se puede cambiar la tienda ni el cliente de un pedido.'
            USING ERRCODE = '42501';
    END IF;

    IF public.can_manage_store(OLD.store_id) THEN
        RETURN NEW;
    END IF;

    IF OLD.customer_id IS DISTINCT FROM v_uid THEN
        RAISE EXCEPTION 'No tienes permiso para modificar este pedido.' USING ERRCODE = '42501';
    END IF;

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

-- -----------------------------------------------------------------------------
-- 3. Equipo: la tabla solo se LEE; se modifica con las funciones de abajo
-- -----------------------------------------------------------------------------
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_members'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.store_members', r.policyname);
    END LOOP;
END $$;
CREATE POLICY "Members can view their store team" ON public.store_members FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.can_manage_store(store_id) OR public.is_admin());

-- Un miembro solo puede ser 'admin' o 'editor'.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_members_role_check') THEN
        UPDATE public.store_members SET role = 'editor' WHERE role NOT IN ('admin', 'editor');
        ALTER TABLE public.store_members
            ADD CONSTRAINT store_members_role_check CHECK (role IN ('admin', 'editor'));
    END IF;
END $$;

-- Plan vigente de un negocio (si la suscripción no está activa, cuenta como Básico).
CREATE OR REPLACE FUNCTION public.store_plan(p_store_id uuid)
RETURNS public.plans
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT p.* FROM public.plans p
     WHERE p.id = COALESCE(
        (SELECT s.plan_id FROM public.subscriptions s WHERE s.store_id = p_store_id AND s.status = 'active'),
        'basic');
$$;
REVOKE ALL ON FUNCTION public.store_plan(uuid) FROM PUBLIC, anon, authenticated;  -- uso interno

-- Plan, comisión y uso del equipo, para la pantalla "Mi plan".
CREATE OR REPLACE FUNCTION public.get_store_plan_info(p_store_id uuid)
RETURNS TABLE (plan_id text, plan_name text, price_cop numeric, commission_percent numeric,
               max_team_members integer, team_count bigint, features jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_plan public.plans;
BEGIN
    IF NOT (public.can_manage_store(p_store_id) OR public.is_admin()) THEN
        RAISE EXCEPTION 'No tienes acceso a este negocio.' USING ERRCODE = '42501';
    END IF;
    v_plan := public.store_plan(p_store_id);
    RETURN QUERY SELECT v_plan.id, v_plan.name, v_plan.price_cop, v_plan.commission_percent,
        v_plan.max_team_members,
        (SELECT count(*) FROM public.store_members m WHERE m.store_id = p_store_id),
        v_plan.features;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_store_team(p_store_id uuid)
RETURNS TABLE (user_id uuid, email text, full_name text, role text, is_owner boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT (public.can_manage_store(p_store_id) OR public.is_admin()) THEN
        RAISE EXCEPTION 'No tienes acceso a este negocio.' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
        SELECT m.user_id, pr.email, pr.full_name, m.role,
               (s.owner_id = m.user_id), m.created_at
          FROM public.store_members m
          JOIN public.stores s ON s.id = m.store_id
          LEFT JOIN public.profiles pr ON pr.id = m.user_id
         WHERE m.store_id = p_store_id
         ORDER BY (s.owner_id = m.user_id) DESC, m.created_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_store_member(p_store_id uuid, p_email text, p_role text DEFAULT 'editor')
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_target   public.profiles;
    v_plan     public.plans;
    v_count    bigint;
BEGIN
    IF NOT public.can_admin_store_team(p_store_id) THEN
        RAISE EXCEPTION 'Solo el dueño o un administrador del equipo puede agregar personas.' USING ERRCODE = '42501';
    END IF;
    IF p_role NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'Rol inválido: usa "admin" o "editor".';
    END IF;

    SELECT * INTO v_target FROM public.profiles WHERE lower(email) = lower(btrim(p_email));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No encontramos una cuenta con ese correo. Pídele a la persona que se registre primero en AmiOriente.'
            USING ERRCODE = 'P0002';
    END IF;
    IF v_target.role NOT IN ('cliente', 'tienda') THEN
        RAISE EXCEPTION 'Esa cuenta no puede unirse a un equipo (tipo de cuenta no permitido).' USING ERRCODE = '42501';
    END IF;
    IF EXISTS (SELECT 1 FROM public.store_members WHERE store_id = p_store_id AND user_id = v_target.id) THEN
        RAISE EXCEPTION 'Esa persona ya hace parte del equipo.' USING ERRCODE = '23505';
    END IF;

    v_plan := public.store_plan(p_store_id);
    SELECT count(*) INTO v_count FROM public.store_members WHERE store_id = p_store_id;
    IF v_plan.max_team_members IS NOT NULL AND v_count >= v_plan.max_team_members THEN
        RAISE EXCEPTION 'Tu plan % permite hasta % personas en el equipo. Mejora tu plan para agregar más.',
            v_plan.name, v_plan.max_team_members USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.store_members (store_id, user_id, role) VALUES (p_store_id, v_target.id, p_role);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_store_member_role(p_store_id uuid, p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT public.can_admin_store_team(p_store_id) THEN
        RAISE EXCEPTION 'Solo el dueño o un administrador del equipo puede cambiar roles.' USING ERRCODE = '42501';
    END IF;
    IF p_role NOT IN ('admin', 'editor') THEN
        RAISE EXCEPTION 'Rol inválido: usa "admin" o "editor".';
    END IF;
    IF EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND owner_id = p_user_id) THEN
        RAISE EXCEPTION 'El rol del dueño del negocio no se puede cambiar.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.store_members SET role = p_role WHERE store_id = p_store_id AND user_id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Esa persona no hace parte del equipo.' USING ERRCODE = 'P0002';
    END IF;
END;
$function$;

-- Quitar a alguien del equipo, o salirse uno mismo. El dueño no puede salir.
CREATE OR REPLACE FUNCTION public.remove_store_member(p_store_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id AND owner_id = p_user_id) THEN
        RAISE EXCEPTION 'El dueño del negocio no se puede quitar del equipo.' USING ERRCODE = '42501';
    END IF;
    IF NOT (public.can_admin_store_team(p_store_id) OR p_user_id = auth.uid()) THEN
        RAISE EXCEPTION 'No tienes permiso para quitar a esta persona.' USING ERRCODE = '42501';
    END IF;
    DELETE FROM public.store_members WHERE store_id = p_store_id AND user_id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Esa persona no hace parte del equipo.' USING ERRCODE = 'P0002';
    END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_store_plan_info(uuid), public.get_store_team(uuid),
    public.add_store_member(uuid, text, text), public.update_store_member_role(uuid, uuid, text),
    public.remove_store_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_store_plan_info(uuid), public.get_store_team(uuid),
    public.add_store_member(uuid, text, text), public.update_store_member_role(uuid, uuid, text),
    public.remove_store_member(uuid, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. Cambio de plan (solo administrador de la plataforma)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_store_plan(p_store_id uuid, p_plan_id text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_plan  public.plans;
    v_count bigint;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Solo el administrador de la plataforma puede cambiar el plan.' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_plan FROM public.plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El plan "%" no existe.', p_plan_id USING ERRCODE = 'P0002';
    END IF;
    SELECT count(*) INTO v_count FROM public.store_members WHERE store_id = p_store_id;
    IF v_plan.max_team_members IS NOT NULL AND v_count > v_plan.max_team_members THEN
        RAISE EXCEPTION 'El negocio tiene % personas en el equipo y el plan % permite %. Quita miembros antes de bajar de plan.',
            v_count, v_plan.name, v_plan.max_team_members USING ERRCODE = 'P0001';
    END IF;
    INSERT INTO public.subscriptions (store_id, plan_id, status, updated_at)
    VALUES (p_store_id, p_plan_id, 'active', now())
    ON CONFLICT (store_id) DO UPDATE SET plan_id = EXCLUDED.plan_id, status = 'active', updated_at = now();
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_set_store_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_store_plan(uuid, text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Comisión por venta según el plan del negocio
--    (reemplaza el 22 % fijo del trigger; sigue registrando una transacción por
--    cada producto del pedido y guarda la tasa vigente en ese momento)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_order_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    order_store_id UUID;
    product_price NUMERIC;
    v_service_type_id UUID;
    v_rate NUMERIC;
BEGIN
    SELECT o.store_id, p.price
      INTO order_store_id, product_price
      FROM public.orders o
      JOIN public.products p ON p.id = NEW.product_id
     WHERE o.id = NEW.order_id;

    -- tipo de servicio (la tabla lo exige); se prefiere 'Productos'
    SELECT id INTO v_service_type_id FROM public.service_types WHERE name = 'Productos' LIMIT 1;
    IF v_service_type_id IS NULL THEN
        SELECT id INTO v_service_type_id FROM public.service_types ORDER BY name ASC LIMIT 1;
    END IF;

    -- tasa = comisión del plan del negocio (fracción: 10 % -> 0.10)
    v_rate := (public.store_plan(order_store_id)).commission_percent / 100.0;

    IF v_service_type_id IS NOT NULL THEN
        INSERT INTO public.transactions(order_id, store_id, product_id, service_type_id, amount, commission_rate)
        VALUES (NEW.order_id, order_store_id, NEW.product_id, v_service_type_id,
                product_price * NEW.quantity, COALESCE(v_rate, 0));
    ELSE
        RAISE WARNING 'No hay service_types configurados; no se registró la transacción del pedido %', NEW.order_id;
    END IF;

    RETURN NEW;
END;
$function$;

COMMIT;

-- =============================================================================
-- Verificaciones (ejecútalas UNA POR UNA)
-- =============================================================================
-- 1) Planes cargados:
-- SELECT id, name, price_cop, commission_percent, max_team_members FROM public.plans ORDER BY sort_order;
-- 2) Ningún negocio sin suscripción ni sin dueño en su equipo (esperado: 0 y 0):
-- SELECT count(*) FROM public.stores s WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions x WHERE x.store_id = s.id);
-- SELECT count(*) FROM public.stores s WHERE NOT EXISTS (SELECT 1 FROM public.store_members m WHERE m.store_id = s.id AND m.user_id = s.owner_id);
--
-- Para CAMBIAR precios/comisión/límites (ejemplos):
-- UPDATE public.plans SET commission_percent = 8 WHERE id = 'basic';
-- UPDATE public.plans SET price_cop = 69900 WHERE id = 'pro';
-- Para cambiar el plan de un negocio: desde el Panel de Administración de la app.
