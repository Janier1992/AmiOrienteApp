-- Migration: Complete the coupon/discount system end-to-end
-- Date: 2026-10-04
--
-- Context: DiscountsTab.jsx (store owner side) already creates codes in
-- `discounts`, and CouponsTab.jsx (customer side) already browses them
-- read-only. Neither side applied a code at checkout. This migration adds
-- what CheckoutPage.jsx now needs to validate and redeem a code safely:
--
-- 1. `orders.discount_code` / `orders.discount_amount` to record which
--    code (if any) was applied and how much it took off.
-- 2. A public SELECT policy on `discounts` so customers can look up a
--    code by its text at checkout (CouponsTab's browsing query already
--    depends on this same kind of access — this makes it explicit/idempotent
--    rather than assuming it already existed).
-- 3. A SECURITY DEFINER `redeem_discount(code, store_id)` function that
--    atomically re-validates (not expired, under usage_limit) and
--    increments usage_count in one locked statement, then returns the
--    discount's type/value. This avoids granting customers any direct
--    UPDATE access to the discounts table (which would let them tamper
--    with value/expires_at/usage_limit), while still letting the
--    redemption happen safely under concurrent checkouts.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS discount_code text,
    ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

DROP POLICY IF EXISTS "Anyone can view active discounts" ON public.discounts;
CREATE POLICY "Anyone can view active discounts"
    ON public.discounts FOR SELECT
    USING (true);

CREATE OR REPLACE FUNCTION public.redeem_discount(p_code text, p_store_id uuid)
RETURNS TABLE (id uuid, discount_type text, value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_discount record;
BEGIN
    SELECT d.* INTO v_discount
    FROM public.discounts d
    WHERE upper(d.code) = upper(p_code)
      AND d.store_id = p_store_id
      AND d.expires_at > now()
      AND (d.usage_limit IS NULL OR d.usage_count < d.usage_limit)
    FOR UPDATE;

    IF v_discount IS NULL THEN
        RAISE EXCEPTION 'Código de descuento inválido, expirado o agotado';
    END IF;

    UPDATE public.discounts
    SET usage_count = usage_count + 1
    WHERE public.discounts.id = v_discount.id;

    RETURN QUERY SELECT v_discount.id, v_discount.discount_type, v_discount.value;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_discount(text, uuid) TO authenticated;
