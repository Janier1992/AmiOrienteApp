-- Migration: un pedido solo puede tener UNA entrega activa
-- Date: 2026-10-07
--
-- deliveryService.aceptarEntrega() primero consulta si el pedido ya tiene una
-- entrega y luego inserta. Esa verificación no es atómica: si dos domiciliarios
-- pulsan "Aceptar Pedido" casi al mismo tiempo, ambos pasan la consulta y se
-- crean dos entregas para el mismo pedido.
--
-- Este índice único parcial hace que la base de datos rechace la segunda
-- inserción (error 23505), que el cliente ya traduce a
-- "Este pedido ya fue tomado por otro domiciliario".
--
-- Si la creación del índice falla porque ya existen entregas duplicadas
-- activas, revísalas primero con:
--   SELECT order_id, count(*) FROM public.deliveries
--   WHERE status <> 'Entregado' GROUP BY order_id HAVING count(*) > 1;

CREATE UNIQUE INDEX IF NOT EXISTS deliveries_one_active_per_order
    ON public.deliveries (order_id)
    WHERE status <> 'Entregado';
