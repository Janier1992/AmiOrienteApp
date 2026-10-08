-- Migration: Add stores.hours (free-text business hours)
-- Date: 2026-10-07
-- StoresPage's StoreCard already conditionally renders {store.hours} (added
-- earlier this week with a fallback to SAMPLE_STORES' mock field), but no
-- real store could ever have this set — there was no column and no form.
-- Kept deliberately simple (free text, e.g. "Lun-Sáb 8:00 AM - 8:00 PM")
-- rather than a structured per-day schedule table: nothing else in the app
-- needs to compute "is this store open right now", so a day-by-day
-- open/close picker would be speculative scope the product doesn't need yet.

ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS hours text;
