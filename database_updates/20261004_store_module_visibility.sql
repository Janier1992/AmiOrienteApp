-- Migration: Let platform admins hide specific dashboard modules per store
-- Date: 2026-10-04
--
-- Admin panel feature: not every store needs every tab its vertical
-- enables by default (e.g. a small farmacia might not want "Descuentos").
-- disabled_modules stores the feature/common-tab keys an admin has
-- explicitly hidden for that store; UniversalStoreDashboard filters them
-- out when building the tab list. Empty by default = unchanged behavior
-- for every existing store.
--
-- No new RLS policy needed: the existing "Platform admins can update any
-- store" policy (USING is_admin()) already covers UPDATE on every column,
-- and the existing owner/public SELECT policies on stores already return
-- '*', so this column flows through automatically.

ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS disabled_modules text[] NOT NULL DEFAULT '{}';
