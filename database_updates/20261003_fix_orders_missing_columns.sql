-- Migration: Add missing columns to orders
-- Date: 2026-10-03
-- Root cause: orderService.crearPedido() (the real customer checkout path,
-- used by CheckoutPage.jsx for catalog purchases with home delivery) has
-- been inserting subtotal/service_fee/delivery_fee/delivery_lat/
-- delivery_lng/payment_method/notes into `orders`, but NONE of these
-- columns actually exist on the live table (confirmed via
-- information_schema.columns: orders only has id, store_id, customer_id,
-- status, total, delivery_address, commission_fee, created_at).
-- This means every online customer checkout for home delivery has been
-- failing at the INSERT step with "column does not exist". In-store POS
-- sales (posService.createPOSSale) were unaffected since they only ever
-- insert store_id/customer_id/status/total/delivery_address.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
    ADD COLUMN IF NOT EXISTS service_fee NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_lat NUMERIC,
    ADD COLUMN IF NOT EXISTS delivery_lng NUMERIC,
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill existing rows so subtotal/total stay consistent where possible
-- (historical delivery_fee/service_fee are unknown, left at 0 rather than guessed).
UPDATE public.orders
SET subtotal = total
WHERE subtotal IS NULL;
