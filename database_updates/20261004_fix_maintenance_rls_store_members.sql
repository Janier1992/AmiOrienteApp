-- Migration: Fix store_equipment/maintenance_logs RLS (critical, active feature)
-- Date: 2026-10-04
-- All 6 policies on store_equipment/maintenance_logs check membership
-- via `store_id IN (SELECT store_id FROM store_members WHERE user_id =
-- auth.uid())`. No code anywhere in the app ever inserts into
-- store_members (confirmed: zero writers in the whole codebase), so
-- this condition is always false for everyone — the "Mantenimiento" tab
-- (now live, wired into the restaurante vertical) can neither save nor
-- read equipment/logs for any store owner.
--
-- Replaced with the proven stores.owner_id = auth.uid() pattern used
-- everywhere else in this schema. store_members / "Equipo" (inviting
-- staff beyond the owner) stays as a separate, not-yet-built feature —
-- this migration only unblocks the owner's own access.

DROP POLICY IF EXISTS "Store owners can view their equipment" ON public.store_equipment;
DROP POLICY IF EXISTS "Store owners can insert equipment" ON public.store_equipment;
DROP POLICY IF EXISTS "Store owners can update their equipment" ON public.store_equipment;
DROP POLICY IF EXISTS "Store owners can delete their equipment" ON public.store_equipment;
DROP POLICY IF EXISTS "Store owners can view logs for their equipment" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Store owners can insert logs" ON public.maintenance_logs;

CREATE POLICY "Store owners can view their equipment"
    ON public.store_equipment FOR SELECT
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can insert equipment"
    ON public.store_equipment FOR INSERT
    WITH CHECK (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can update their equipment"
    ON public.store_equipment FOR UPDATE
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can delete their equipment"
    ON public.store_equipment FOR DELETE
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

CREATE POLICY "Store owners can view logs for their equipment"
    ON public.maintenance_logs FOR SELECT
    USING (
        equipment_id IN (
            SELECT id FROM public.store_equipment
            WHERE auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_equipment.store_id)
        )
    );

CREATE POLICY "Store owners can insert logs"
    ON public.maintenance_logs FOR INSERT
    WITH CHECK (
        equipment_id IN (
            SELECT id FROM public.store_equipment
            WHERE auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_equipment.store_id)
        )
    );
