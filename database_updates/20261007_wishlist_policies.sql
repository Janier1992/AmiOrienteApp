-- Migration: lista de deseos del cliente (tabla wishlist) con RLS
-- Date: 2026-10-07
--
-- El panel del cliente ya leía `wishlist`, pero ningún producto permitía
-- agregarlo. Ahora ProductsPage y ProductDetailPage insertan
-- (user_id, product_id) con el componente WishlistButton.
--
-- Si la tabla ya existe, el CREATE TABLE no hace nada. Las políticas se
-- recrean de forma idempotente: cada usuario solo ve y modifica lo suyo.

CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Un producto solo puede estar una vez en la lista de cada usuario.
-- (Si falla por duplicados existentes, elimínalos primero.)
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_product_unique
    ON public.wishlist (user_id, product_id);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own wishlist" ON public.wishlist;
CREATE POLICY "Users view own wishlist"
    ON public.wishlist FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users add to own wishlist" ON public.wishlist;
CREATE POLICY "Users add to own wishlist"
    ON public.wishlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users remove from own wishlist" ON public.wishlist;
CREATE POLICY "Users remove from own wishlist"
    ON public.wishlist FOR DELETE
    USING (auth.uid() = user_id);
