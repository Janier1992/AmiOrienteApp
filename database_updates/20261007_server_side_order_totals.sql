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
