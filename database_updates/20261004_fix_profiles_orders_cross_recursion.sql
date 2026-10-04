-- Migration: Fix cross-table RLS recursion between profiles and orders
-- Date: 2026-10-04
--
-- Root cause (confirmed via pg_policies dump): orders already had a
-- "Allow delivery personnel to see available orders" SELECT policy that
-- queries `profiles` (SELECT profiles.role FROM profiles WHERE profiles.id
-- = auth.uid()). Today's "Store owners can view their customers' profiles"
-- policy on `profiles` queries `orders` back (EXISTS (SELECT 1 FROM orders
-- o JOIN stores s ...)). Postgres evaluates every permissive policy for a
-- table to OR them together, so ANY `orders` SELECT now has to evaluate the
-- delivery-personnel policy -> which evaluates profiles' RLS -> which
-- evaluates the store-owners-view-customers policy -> which queries orders
-- again. That's a genuine infinite recursion across two tables (42P17),
-- surfaced by PostgREST as the 500s seen on both `profiles` and `orders`
-- queries.
--
-- Fix: move the orders/stores lookup inside a SECURITY DEFINER function,
-- same proven pattern as is_admin() — its internal query bypasses RLS, so
-- evaluating it from within profiles' policy no longer re-triggers orders'
-- RLS and the cycle is broken.

CREATE OR REPLACE FUNCTION public.is_customer_of_my_store(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.customer_id = p_profile_id
    AND s.owner_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Store owners can view their customers' profiles" ON public.profiles;
CREATE POLICY "Store owners can view their customers' profiles"
    ON public.profiles FOR SELECT
    USING (public.is_customer_of_my_store(profiles.id));
