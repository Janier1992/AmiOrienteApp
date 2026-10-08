-- =============================================================================
-- AmiOriente · PARTE 1 de 3 · Alineación con la base real y endurecimiento (20261007)
-- Pega TODO este archivo en Supabase → SQL Editor y pulsa Run. Idempotente.
-- Haz un BACKUP antes (Database → Backups).
-- =============================================================================

-- ############ 20261007_add_missing_timestamp_columns.sql ############
-- Migration: Add timestamp columns the app already writes but the schema never had
-- Date: 2026-10-07
--
-- Confirmed via a real information_schema.columns dump (ver
-- docs/AUDITORIA_SUPABASE_2026-10-07.md, sección B) that these columns do not
-- exist, even though the application code has been writing to them:
--
--   orderService.actualizarEstado()  -> orders.updated_at   (every status change)
--   orderService.cancelarPedido()    -> orders.cancelled_at, orders.cancellation_reason
--   deliveryService.aceptarEntrega() -> deliveries.assigned_at
--   deliveryService.actualizarEstadoEntrega() -> deliveries.picked_up_at, delivered_at
--
-- Impact before this migration: every one of those writes fails against the
-- real database ("column does not exist"), which means no store could ever
-- change an order's status, cancel an order, or have a delivery tracked
-- end-to-end in production. This is purely additive — no existing column,
-- constraint or row is touched.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.deliveries
    ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
    ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
    ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- ############ 20261007_delivery_can_see_ready_orders.sql ############
-- Migration: Delivery personnel can see orders marked "Listo para recogida"
-- Date: 2026-10-07
--
-- Confirmed via pg_policies: "Allow delivery personnel to see available
-- orders" only allows status IN ('Pendiente', 'Pendiente de pago en
-- efectivo'). But that's not the status a store actually sets when an
-- order is ready for pickup (OrdersManagementTab moves it through
-- Confirmado -> En preparación -> Listo para recogida). A domiciliario
-- could never see the one state that matters for them, even with the
-- column-mismatch fixes in deliveryService.obtenerPedidosDisponibles.

DROP POLICY IF EXISTS "Allow delivery personnel to see available orders" ON public.orders;

CREATE POLICY "Allow delivery personnel to see available orders"
    ON public.orders FOR SELECT
    USING (
        status IN ('Pendiente', 'Pendiente de pago en efectivo', 'Listo para recogida')
        AND (SELECT profiles.role FROM public.profiles WHERE profiles.id = auth.uid()) = 'domiciliario'
    );

-- ############ 20261007_lock_down_order_items_insert.sql ############
-- Migration: Customers can no longer insert order_items directly
-- Date: 2026-10-07
--
-- Now that order creation goes through create_order() (SECURITY DEFINER,
-- bypasses RLS for its own inserts — see
-- 20261007_server_side_order_totals.sql), the client-facing app never
-- needs to call `supabase.from('order_items').insert(...)` as a customer
-- again. But the RLS policy "Customers can create order items for their
-- orders" still allowed it directly via the REST API, with no check on
-- price or product_id — a customer could still add a fabricated-price
-- item to one of their own existing orders after the fact.
--
-- Store owners keep their own INSERT policy untouched (posService's POS
-- flow legitimately inserts order_items directly as the store selling
-- its own inventory).

DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'order_items' AND cmd = 'INSERT'
               AND policyname ILIKE '%customer%'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.order_items', r.policyname);
    END LOOP;
END $$;

-- ############ 20261007_products_stock_check.sql ############
-- Migration: products.stock can never go negative, enforced by the database itself
-- Date: 2026-10-07
-- Audit finding #13: the stock-decrementing trigger subtracts without
-- validating, and create_order() only protects the customer checkout path
-- (not POS sales or any other writer). A CHECK constraint is the one
-- guarantee that holds no matter which code path writes to this column.
--
-- Added NOT VALID: enforces the rule for every INSERT/UPDATE from now on
-- without failing this migration if some existing row is already
-- negative (which would otherwise abort the whole ALTER TABLE). Run the
-- VALIDATE line separately afterwards — if it fails, it'll tell you which
-- existing rows need a manual fix before the constraint can be trusted
-- for 100% of historical data too.

ALTER TABLE public.products
    DROP CONSTRAINT IF EXISTS products_stock_non_negative;

ALTER TABLE public.products
    ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0) NOT VALID;

-- Run this separately after confirming the migration above succeeded:
-- ALTER TABLE public.products VALIDATE CONSTRAINT products_stock_non_negative;

-- ############ 20261007_revoke_truncate_trigger_references.sql ############
-- Migration: Revoke TRUNCATE/TRIGGER/REFERENCES from anon/authenticated (audit #12)
-- Date: 2026-10-07
-- Supabase grants ALL privileges (including TRUNCATE, TRIGGER, REFERENCES)
-- to anon/authenticated by default on every table. The app only ever uses
-- SELECT/INSERT/UPDATE/DELETE through RLS — these three don't go through
-- RLS at all, so leaving them open is pure unused attack surface.

DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.%I FROM anon, authenticated', r.tablename);
    END LOOP;
END $$;

-- Best-effort for future tables: only applies to objects created by the
-- role running this migration (typically `postgres` in the SQL editor),
-- not necessarily to however Supabase's own tooling provisions new
-- tables. Re-run the loop above after adding new tables if needed.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;

-- ############ 20261007_security_hardening_batch2.sql ############
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

-- ############ 20261007_server_side_order_totals.sql ############
-- Migration: Recalculate order totals on the server (create_order)
-- Date: 2026-10-07
--
-- Root issue (ver docs/AUDITORIA_SUPABASE_2026-10-07.md, hallazgo A3/#14):
-- orderService.crearPedido() computes subtotal, service fee, shipping,
-- taxes and discount IN THE BROWSER and sends the final numbers straight
-- into an INSERT. A customer could edit those values in devtools before
-- they're sent — nothing on the server ever re-derives them from real
-- product prices, real shipping rates or a real discount lookup.
--
-- This function moves that calculation server-side: the client sends only
-- {product_id, quantity} pairs plus the customer's selections (coupon
-- code, shipping rate id), and everything financial is computed here from
-- the real tables, inside one transaction.
--
-- Depends on (already live): public.redeem_discount(text, uuid) — reused
-- as-is for atomic coupon validation+usage tracking, and the stock-
-- decrementing trigger on order_items (not duplicated here — this
-- function only validates stock with a row lock, it doesn't subtract it
-- itself, to avoid double-decrementing).
--
-- NOTE — residual limitation: SERVICE_FEE/DELIVERY_BASE_FEE are
-- duplicated here as constants matching src/lib/constants.js. If those
-- JS constants ever change, this function must be updated too (there is
-- no shared platform-settings table yet). Documented as a known gap, not
-- silently left out.

CREATE OR REPLACE FUNCTION public.create_order(
    p_store_id uuid,
    p_items jsonb,                      -- [{"product_id": "...", "quantity": 2}, ...]
    p_delivery_address text,
    p_payment_method text DEFAULT 'efectivo',
    p_notes text DEFAULT NULL,
    p_discount_code text DEFAULT NULL,
    p_shipping_rate_id uuid DEFAULT NULL,
    p_delivery_lat numeric DEFAULT NULL,
    p_delivery_lng numeric DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id uuid := auth.uid();
    v_item jsonb;
    v_product public.products%ROWTYPE;
    v_quantity integer;
    v_subtotal numeric := 0;
    v_service_fee numeric := 2000;   -- debe coincidir con SERVICE_FEE en src/lib/constants.js
    v_shipping_fee numeric;
    v_tax_rate numeric;
    v_tax_amount numeric := 0;
    v_discount record;
    v_discount_amount numeric := 0;
    v_total numeric;
    v_status text;
    v_order public.orders%ROWTYPE;
    v_items_to_insert jsonb := '[]'::jsonb;
BEGIN
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para crear un pedido.' USING ERRCODE = '42501';
    END IF;
    IF p_delivery_address IS NULL OR btrim(p_delivery_address) = '' THEN
        RAISE EXCEPTION 'La dirección de entrega es requerida.';
    END IF;
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'El pedido debe tener al menos un producto.';
    END IF;

    -- 1. Recalcular subtotal con precios REALES de la base, validar stock
    --    (con bloqueo de fila: evita que dos compras simultáneas sobrevendan).
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := (v_item->>'quantity')::integer;
        IF v_quantity IS NULL OR v_quantity < 1 THEN
            RAISE EXCEPTION 'Cantidad inválida para un producto.';
        END IF;

        SELECT * INTO v_product
        FROM public.products
        WHERE id = (v_item->>'product_id')::uuid
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Uno de los productos ya no existe.';
        END IF;
        IF v_product.store_id <> p_store_id THEN
            RAISE EXCEPTION 'Todos los productos de un pedido deben ser de la misma tienda.';
        END IF;
        IF v_product.stock < v_quantity THEN
            RAISE EXCEPTION 'No hay stock suficiente de "%".', v_product.name;
        END IF;

        v_subtotal := v_subtotal + (v_product.price * v_quantity);
        v_items_to_insert := v_items_to_insert || jsonb_build_object(
            'product_id', v_product.id,
            'quantity', v_quantity,
            'price', v_product.price
        );
    END LOOP;

    -- 2. Envío: valida que la tarifa elegida realmente pertenezca a esta tienda.
    IF p_shipping_rate_id IS NOT NULL THEN
        SELECT sr.price INTO v_shipping_fee
        FROM public.shipping_rates sr
        JOIN public.shipping_zones sz ON sz.id = sr.zone_id
        WHERE sr.id = p_shipping_rate_id AND sz.store_id = p_store_id;

        IF v_shipping_fee IS NULL THEN
            RAISE EXCEPTION 'La tarifa de envío seleccionada no es válida para esta tienda.';
        END IF;
    ELSE
        v_shipping_fee := 4000; -- debe coincidir con DELIVERY_BASE_FEE en src/lib/constants.js
    END IF;

    -- 3. Impuestos configurados para la tienda.
    SELECT COALESCE(SUM(rate), 0) INTO v_tax_rate FROM public.taxes WHERE store_id = p_store_id;
    v_tax_amount := v_subtotal * v_tax_rate;

    -- 4. Cupón: reutiliza redeem_discount(), que ya valida vigencia/límite y
    --    marca el uso de forma atómica (con bloqueo de fila) — si el código
    --    no es válido, esta llamada lanza excepción y aborta todo el pedido.
    IF p_discount_code IS NOT NULL AND btrim(p_discount_code) <> '' THEN
        SELECT * INTO v_discount FROM public.redeem_discount(p_discount_code, p_store_id);
        v_discount_amount := CASE
            WHEN v_discount.discount_type = 'percentage' THEN round(v_subtotal * (v_discount.value / 100))
            ELSE LEAST(v_discount.value, v_subtotal)
        END;
    END IF;

    v_total := GREATEST(0, v_subtotal + v_service_fee + v_shipping_fee + v_tax_amount - v_discount_amount);
    v_status := CASE WHEN COALESCE(p_payment_method, 'efectivo') = 'efectivo'
                      THEN 'Pendiente de pago en efectivo' ELSE 'Pendiente' END;

    INSERT INTO public.orders (
        customer_id, store_id, delivery_address, delivery_lat, delivery_lng,
        payment_method, notes, subtotal, service_fee, delivery_fee,
        discount_code, discount_amount, tax_amount, shipping_rate_id, total, status
    ) VALUES (
        v_customer_id, p_store_id, p_delivery_address, p_delivery_lat, p_delivery_lng,
        COALESCE(p_payment_method, 'efectivo'), p_notes, v_subtotal, v_service_fee, v_shipping_fee,
        NULLIF(p_discount_code, ''), v_discount_amount, v_tax_amount, p_shipping_rate_id, v_total, v_status
    ) RETURNING * INTO v_order;

    -- order_items con el precio REAL que se acaba de leer, no el que haya
    -- mandado el cliente. El trigger existente de stock se encarga de
    -- restar la cantidad al insertar (no se duplica aquí).
    INSERT INTO public.order_items (order_id, product_id, quantity, price)
    SELECT v_order.id, (i->>'product_id')::uuid, (i->>'quantity')::integer, (i->>'price')::numeric
    FROM jsonb_array_elements(v_items_to_insert) i;

    RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(uuid, jsonb, text, text, text, text, uuid, numeric, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order(uuid, jsonb, text, text, text, text, uuid, numeric, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, jsonb, text, text, text, text, uuid, numeric, numeric) TO authenticated;

-- ############ 20261007_store_hours_column.sql ############
-- Migration: Add stores.hours (free-text business hours)
-- Date: 2026-10-07
-- StoresPage's StoreCard already conditionally renders {store.hours} (added
-- earlier this week with a fallback to SAMPLE_STORES' mock field), but no
-- real store could ever have this set — there was no column and no form.
-- Kept deliberately simple (free text, e.g. "Lun-Sáb 8:00 AM - 8:00 PM")
-- rather than a structured per-day schedule table: nothing else in the app
-- needs to compute "is this store open right now", so a day-by-day
-- open/close picker would be speculative scope the product doesn't need yet.

ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS hours text;
