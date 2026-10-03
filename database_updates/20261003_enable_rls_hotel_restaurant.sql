-- Migration: Enable RLS on hotel_rooms and restaurant_tables
-- Date: 2026-10-03
-- Reason: Live audit of pg_tables found both tables with rowsecurity = false.
-- Any client using the public anon key could read or write ANY store's rooms
-- or tables, not just their own (cross-tenant data leak). Closes that gap
-- using the same store ownership pattern already proven in
-- 20251222_fix_pos_rls.sql (stores.owner_id = auth.uid()).

ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- hotel_rooms: only the owner of the store can see/manage its rooms
CREATE POLICY "Store owners can view their hotel rooms"
    ON public.hotel_rooms FOR SELECT
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can insert hotel rooms"
    ON public.hotel_rooms FOR INSERT
    WITH CHECK (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can update their hotel rooms"
    ON public.hotel_rooms FOR UPDATE
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can delete their hotel rooms"
    ON public.hotel_rooms FOR DELETE
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

-- restaurant_tables: only the owner of the store can see/manage its tables
CREATE POLICY "Store owners can view their restaurant tables"
    ON public.restaurant_tables FOR SELECT
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can insert restaurant tables"
    ON public.restaurant_tables FOR INSERT
    WITH CHECK (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can update their restaurant tables"
    ON public.restaurant_tables FOR UPDATE
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can delete their restaurant tables"
    ON public.restaurant_tables FOR DELETE
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
