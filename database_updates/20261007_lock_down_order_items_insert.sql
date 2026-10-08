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
