-- Migration: Fix infinite recursion in profiles RLS (critical, self-inflicted)
-- Date: 2026-10-03
-- The "Platform admins can view all profiles" policy added in
-- 20261003_platform_admin.sql checked admin status with a raw subquery
-- against public.profiles from WITHIN a policy on public.profiles itself,
-- which Postgres detects as infinite recursion (42P17) and rejects. This
-- broke every query against `profiles` for every user (not just admins),
-- taking down login/dashboard loading app-wide.
--
-- Fix: move the admin check into a SECURITY DEFINER function. Functions
-- created this way run with the owning (superuser) role's privileges,
-- which bypasses RLS for the function's internal query and breaks the
-- recursive cycle — the standard Supabase pattern for this exact case.

DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Platform admins can update any store" ON public.stores;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE POLICY "Platform admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Platform admins can update any store"
    ON public.stores FOR UPDATE
    USING (public.is_admin());
