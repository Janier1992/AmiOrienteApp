-- Migration: Add timestamp columns the app already writes but the schema never had
-- Date: 2026-10-07
--
-- Confirmed via a real information_schema.columns dump (ver
-- docs/AUDITORIA_SUPABASE_2026-10-07.md, sección B) that these columns do not
-- exist, even though the application code has been writing to them:
--
--   orderService.actualizarEstado()  -> orders.updated_at   (every status change)
--   orderService.cancelarPedido()    -> orders.cancelled_at, orders.cancellation_reason
--   deliveryService.aceptarEntrega() -> deliveries.assigned_at
--   deliveryService.actualizarEstadoEntrega() -> deliveries.picked_up_at, delivered_at
--
-- Impact before this migration: every one of those writes fails against the
-- real database ("column does not exist"), which means no store could ever
-- change an order's status, cancel an order, or have a delivery tracked
-- end-to-end in production. This is purely additive — no existing column,
-- constraint or row is touched.

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
    ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.deliveries
    ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
    ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
    ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
