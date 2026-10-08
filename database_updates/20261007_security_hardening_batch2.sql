-- Migration: Security hardening batch 2 (audit findings #5, #6, #7, #8, #10, #11)
-- Date: 2026-10-07
-- Ver docs/AUDITORIA_SUPABASE_2026-10-07.md — estos son los hallazgos ALTO/MEDIO
-- que quedaron documentados pero sin corregir tras la migración crítica A1-A4.
-- Todos son cambios mecánicos (agregar WITH CHECK, restringir permisos) que no
-- alteran ningún flujo legítimo existente.
--
-- Nota de implementación: para #5, #7 y #10 no se asume el nombre de la
-- política existente — se eliminan TODAS las políticas de ese
-- tabla+comando antes de crear la nueva. En RLS, varias políticas
-- permisivas se combinan con OR, así que reemplazar solo "la que creemos
-- que es" dejaría la vieja (insegura) todavía activa en paralelo.

-- -----------------------------------------------------------------------------
-- #5. Mensajes de contacto: cualquier usuario autenticado podía leerlos.
--     Solo el admin debería.
-- -----------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.contact_submissions', r.policyname);
    END LOOP;
END $$;

CREATE POLICY "Allow admins to read contact submissions"
    ON public.contact_submissions FOR SELECT
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- #6. Una tienda podía reactivarse a sí misma tras ser suspendida por el
--     admin, o quitarse módulos que el admin le había ocultado — la política
--     de UPDATE del dueño no tenía WITH CHECK que protegiera esas columnas.
--     (Trigger: se suma a las políticas existentes, no las reemplaza.)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_store_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF current_user IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Solo un administrador puede cambiar el estado de la tienda.'
                USING ERRCODE = '42501';
        END IF;
        IF NEW.disabled_modules IS DISTINCT FROM OLD.disabled_modules THEN
            RAISE EXCEPTION 'Solo un administrador puede cambiar los módulos visibles de la tienda.'
                USING ERRCODE = '42501';
        END IF;
        IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
            RAISE EXCEPTION 'No se puede transferir la propiedad de la tienda.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_store_admin_columns ON public.stores;
CREATE TRIGGER trg_protect_store_admin_columns
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.protect_store_admin_columns();

-- -----------------------------------------------------------------------------
-- #7. subscriptions: un miembro de tienda podía cambiar su propio plan/estado
--     con un UPDATE directo. No cobra nada todavía, pero será crítico al
--     activar pagos — mejor cerrarlo ya.
-- -----------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
    IF to_regclass('public.subscriptions') IS NOT NULL THEN
        FOR r IN SELECT policyname FROM pg_policies
                 WHERE schemaname = 'public' AND tablename = 'subscriptions' AND cmd = 'UPDATE'
        LOOP
            EXECUTE format('DROP POLICY %I ON public.subscriptions', r.policyname);
        END LOOP;

        EXECUTE $pol$
            CREATE POLICY "Only admins can update subscriptions"
                ON public.subscriptions FOR UPDATE
                USING (public.is_admin())
        $pol$;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- #8. redeem_discount era ejecutable por `anon` (sin sesión). Un cupón nunca
--     debería poder gastarse sin un usuario autenticado detrás.
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.redeem_discount(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_discount(text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_discount(text, uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- #10. deliveries INSERT solo exigía rol domiciliario, no que la entrega se
--      creara a nombre de quien hace la petición — un domiciliario podía
--      insertar una entrega asignada a otro domiciliario.
-- -----------------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'deliveries' AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.deliveries', r.policyname);
    END LOOP;
END $$;

CREATE POLICY "Delivery personnel can create their own deliveries"
    ON public.deliveries FOR INSERT
    WITH CHECK (
        delivery_person_id = auth.uid()
        AND (SELECT profiles.role FROM public.profiles WHERE profiles.id = auth.uid()) = 'domiciliario'
    );

-- -----------------------------------------------------------------------------
-- #11. Un dueño de tienda podía actualizar cualquier columna de
--      delivery_payouts (incluido el monto a pagar). Solo debería poder
--      marcar status/paid_at. (Trigger: se suma, no reemplaza políticas.)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_payout_amount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF current_user IN ('anon', 'authenticated') AND NOT public.is_admin() THEN
        IF NEW.amount IS DISTINCT FROM OLD.amount
           OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id THEN
            RAISE EXCEPTION 'No tienes permiso para cambiar el monto de una liquidación.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_payout_amount ON public.delivery_payouts;
CREATE TRIGGER trg_protect_payout_amount
    BEFORE UPDATE ON public.delivery_payouts
    FOR EACH ROW EXECUTE FUNCTION public.protect_payout_amount();

-- -----------------------------------------------------------------------------
-- #15. Índices en las FKs que se consultan constantemente (seguro, aditivo).
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products (store_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_person_id ON public.deliveries (delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores (owner_id);
