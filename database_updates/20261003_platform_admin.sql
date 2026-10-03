-- Migration: Platform super-admin support
-- Date: 2026-10-03
-- Adds a `status` field to stores so the platform owner can
-- suspend/reactivate a business, and a new RLS policy allowing any user
-- whose profiles.role = 'admin' to manage ANY store (not just their own).
--
-- Note: 'admin' is intentionally NOT in the public signup role list
-- (src/services/authService.js rolesValidos) — nobody can self-register
-- as admin. Granting it is a manual step, see the companion instructions.

ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'pending'));

CREATE POLICY "Platform admins can update any store"
    ON public.stores FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Platform admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role = 'admin')
    );
