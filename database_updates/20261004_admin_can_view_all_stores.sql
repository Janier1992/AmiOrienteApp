-- Migration: Let admins read back any store (not just update it)
-- Date: 2026-10-04
--
-- Symptom: saving module visibility (and likely Suspender/Reactivar too,
-- for a non-active store) fails with HTTP 406. adminService calls
-- .update(...).select().single() — after the UPDATE succeeds, PostgREST
-- re-reads the row to return it, and that re-read is itself subject to
-- stores' SELECT policies. "Platform admins can update any store" only
-- grants UPDATE, so for a store that doesn't also match the public/owner
-- SELECT policy (e.g. a suspended store, or simply no admin SELECT bypass
-- at all), the post-update read returns zero rows and .single() surfaces
-- that as 406.
--
-- Fix: same proven is_admin() pattern already used for profiles, applied
-- here as a SELECT policy. No recursion risk — is_admin() is SECURITY
-- DEFINER and only touches profiles internally.

CREATE POLICY "Platform admins can view all stores"
    ON public.stores FOR SELECT
    USING (public.is_admin());
