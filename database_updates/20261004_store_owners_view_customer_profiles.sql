-- Migration: Let store owners see the profiles of their own customers
-- Date: 2026-10-04
-- The new "Clientes" tab (StoreCustomersTab) joins orders -> profiles to
-- show who has bought from a store. profiles only had SELECT policies
-- for "own row" and "admin", so that join always returned null for every
-- order and the tab would silently show "no customers" for everyone.
--
-- Not a recursive policy (queries orders/stores, not profiles itself),
-- so no SECURITY DEFINER wrapper needed — same pattern already proven
-- safe elsewhere in this schema.

CREATE POLICY "Store owners can view their customers' profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.stores s ON s.id = o.store_id
            WHERE o.customer_id = profiles.id
            AND s.owner_id = auth.uid()
        )
    );
