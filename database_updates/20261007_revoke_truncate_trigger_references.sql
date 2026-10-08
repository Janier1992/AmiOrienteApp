-- Migration: Revoke TRUNCATE/TRIGGER/REFERENCES from anon/authenticated (audit #12)
-- Date: 2026-10-07
-- Supabase grants ALL privileges (including TRUNCATE, TRIGGER, REFERENCES)
-- to anon/authenticated by default on every table. The app only ever uses
-- SELECT/INSERT/UPDATE/DELETE through RLS — these three don't go through
-- RLS at all, so leaving them open is pure unused attack surface.

DO $$
DECLARE r record;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.%I FROM anon, authenticated', r.tablename);
    END LOOP;
END $$;

-- Best-effort for future tables: only applies to objects created by the
-- role running this migration (typically `postgres` in the SQL editor),
-- not necessarily to however Supabase's own tooling provisions new
-- tables. Re-run the loop above after adding new tables if needed.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;
