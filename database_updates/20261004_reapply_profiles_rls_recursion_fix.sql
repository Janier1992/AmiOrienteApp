-- Migration: Re-apply the profiles RLS recursion fix (it reverted/was never applied)
-- Date: 2026-10-04
--
-- Symptom reported: logging in with the admin/soporte account redirects to
-- /cliente/dashboard instead of /admin, and the browser console shows every
-- `profiles` query (and anything whose RLS indirectly checks a profiles row,
-- e.g. `orders`) failing with HTTP 500.
--
-- Root cause: this is the exact same infinite-recursion bug documented in
-- 20261003_fix_profiles_rls_recursion.sql — the "Platform admins can view
-- all profiles" policy from 20261003_platform_admin.sql checks admin status
-- with a raw subquery against public.profiles from WITHIN a policy ON
-- public.profiles, which Postgres rejects as infinite recursion (42P17).
-- PostgREST surfaces that as a 500, and adminService.esAdmin() treats any
-- error as "not admin", so the login redirect silently falls through to the
-- customer dashboard.
--
-- That fix was written yesterday but the live database still has the
-- original recursive policy, so it's being re-applied here verbatim
-- (idempotent — safe to run even if parts of it already succeeded).

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

-- Verification: run this after the above and paste the result back —
-- `qual` for "Platform admins can view all profiles" must show
-- `is_admin()`, NOT a raw `SELECT ... FROM profiles` subquery. If any
-- OTHER policy on profiles (or on orders) also shows a raw recursive
-- subquery into profiles here, paste that too — it would explain why
-- orders queries were also returning 500.
-- select tablename, policyname, cmd, qual
-- from pg_policies
-- where tablename in ('profiles', 'orders')
-- order by tablename, policyname;
