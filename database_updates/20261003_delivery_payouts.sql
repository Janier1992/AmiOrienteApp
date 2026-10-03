-- Migration: Delivery person payout tracking
-- Date: 2026-10-03
-- Business model: the customer pays a delivery fee (orders.delivery_fee,
-- currently a flat $4000 COP set in orderService.crearPedido). Of that,
-- 70% goes to the delivery person and 30% stays with the platform.
--
-- A dedicated table (instead of columns on `deliveries`) keeps this
-- isolated from the existing deliveries RLS/write paths used by the
-- delivery person's own app (accepting/updating delivery status), so
-- only the store owner can ever mark a payout as paid.

CREATE TABLE IF NOT EXISTS public.delivery_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID NOT NULL UNIQUE REFERENCES public.deliveries(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.delivery_payouts ENABLE ROW LEVEL SECURITY;

-- Delivery person can see their own payout records (read-only)
CREATE POLICY "Delivery person can view own payouts"
    ON public.delivery_payouts FOR SELECT
    USING (
        delivery_id IN (
            SELECT id FROM public.deliveries WHERE delivery_person_id = auth.uid()
        )
    );

-- Store owner can see and manage payouts tied to their own orders
CREATE POLICY "Store owners can view payouts for their orders"
    ON public.delivery_payouts FOR SELECT
    USING (
        delivery_id IN (
            SELECT d.id FROM public.deliveries d
            JOIN public.orders o ON o.id = d.order_id
            JOIN public.stores s ON s.id = o.store_id
            WHERE s.owner_id = auth.uid()
        )
    );

CREATE POLICY "Store owners can update payouts for their orders"
    ON public.delivery_payouts FOR UPDATE
    USING (
        delivery_id IN (
            SELECT d.id FROM public.deliveries d
            JOIN public.orders o ON o.id = d.order_id
            JOIN public.stores s ON s.id = o.store_id
            WHERE s.owner_id = auth.uid()
        )
    );

-- Auto-create a pending payout record the moment a delivery is marked
-- as 'Entregado', computed from that order's real delivery_fee.
CREATE OR REPLACE FUNCTION public.handle_delivery_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_delivery_fee NUMERIC;
BEGIN
    IF NEW.status = 'Entregado' AND (OLD.status IS DISTINCT FROM 'Entregado') THEN
        SELECT COALESCE(delivery_fee, 0) INTO v_delivery_fee
        FROM public.orders WHERE id = NEW.order_id;

        INSERT INTO public.delivery_payouts (delivery_id, amount, status)
        VALUES (NEW.id, ROUND(v_delivery_fee * 0.70), 'pending')
        ON CONFLICT (delivery_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_delivery_completed ON public.deliveries;
CREATE TRIGGER trg_delivery_completed
AFTER UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.handle_delivery_completed();

-- Backfill: create pending payouts for deliveries already marked as
-- 'Entregado' before this migration existed.
INSERT INTO public.delivery_payouts (delivery_id, amount, status)
SELECT d.id, ROUND(COALESCE(o.delivery_fee, 0) * 0.70), 'pending'
FROM public.deliveries d
JOIN public.orders o ON o.id = d.order_id
WHERE d.status = 'Entregado'
ON CONFLICT (delivery_id) DO NOTHING;
