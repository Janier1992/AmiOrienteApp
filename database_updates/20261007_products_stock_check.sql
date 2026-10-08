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
