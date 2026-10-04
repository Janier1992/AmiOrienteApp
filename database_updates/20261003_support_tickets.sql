-- Migration: Support tickets (store -> platform admin)
-- Date: 2026-10-03
-- Lets a store owner report a problem from their dashboard; the platform
-- admin sees every ticket across all verticals in /admin and can respond
-- and change its status. Reuses public.is_admin() from
-- 20261003_fix_profiles_rls_recursion.sql to avoid any RLS recursion.

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_proceso', 'resuelto')),
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support tickets"
    ON public.support_tickets FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Users can create their own support tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can view all support tickets"
    ON public.support_tickets FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update support tickets"
    ON public.support_tickets FOR UPDATE
    USING (public.is_admin());
