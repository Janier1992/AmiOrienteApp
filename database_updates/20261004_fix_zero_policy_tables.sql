-- Migration: Fix 5 tables with RLS enabled but ZERO policies (critical)
-- Date: 2026-10-04
-- RLS enabled + no policies = nobody can read the table at all, not even
-- the owner. Found via a full pg_tables/pg_policies audit.
--
-- service_categories / service_types are reference lookup tables joined
-- by storeService.obtenerTiendaPorPropietario (.select('*,
-- service_categories(name)')) to determine a store's vertical via
-- getStoreTypeConfig(). With this join silently blocked, every store in
-- production has likely been falling back to the 'general' feature set
-- regardless of its real registered category (restaurante, hotel, etc).
-- tourism_categories/tourism_spots feed the public Turismo page.
-- reviews is user-generated ratings/comments that should be publicly
-- readable (so shoppers can see them) but only editable by their author.

CREATE POLICY "Anyone can view service categories"
    ON public.service_categories FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view service types"
    ON public.service_types FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view tourism categories"
    ON public.tourism_categories FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view tourism spots"
    ON public.tourism_spots FOR SELECT
    USING (true);

CREATE POLICY "Anyone can view reviews"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews"
    ON public.reviews FOR DELETE
    USING (user_id = auth.uid());
