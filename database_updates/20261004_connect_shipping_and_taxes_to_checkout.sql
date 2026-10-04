-- Migration: Connect shipping zones/rates and taxes to real checkout totals
-- Date: 2026-10-04
--
-- Context: ShippingTab.jsx (zones + rates per store) and TaxesTab.jsx (tax
-- rates per store) were fully built CRUD screens that nothing in checkout
-- ever read — delivery was always a flat $3,500 and no tax was ever
-- charged. CheckoutPage.jsx now looks up each cart store's zones/rates (to
-- let the customer pick a delivery zone) and taxes (applied automatically)
-- when creating the order. This requires:
--
-- 1. orders.tax_amount to record the computed tax for that order.
-- 2. orders.shipping_rate_id to record which rate was charged (nullable —
--    stores that haven't configured zones keep using the flat default fee).
-- 3. Public SELECT policies on shipping_zones/shipping_rates/taxes: these
--    were only readable by the owning store owner before (CRUD screens),
--    but a customer picking a delivery zone or having tax computed at
--    checkout needs to read them too.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shipping_rate_id uuid REFERENCES public.shipping_rates(id);

DROP POLICY IF EXISTS "Anyone can view shipping zones" ON public.shipping_zones;
CREATE POLICY "Anyone can view shipping zones"
    ON public.shipping_zones FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can view shipping rates" ON public.shipping_rates;
CREATE POLICY "Anyone can view shipping rates"
    ON public.shipping_rates FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can view taxes" ON public.taxes;
CREATE POLICY "Anyone can view taxes"
    ON public.taxes FOR SELECT
    USING (true);
