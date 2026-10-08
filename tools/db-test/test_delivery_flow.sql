-- Flujo del domiciliario de punta a punta (se ejecuta sobre la base "después").
\set o '00000000-0000-0000-0000-00000000f003'
\set d1 '00000000-0000-0000-0000-0000000000d1'
\set d2 '00000000-0000-0000-0000-0000000000d2'
DELETE FROM public.deliveries;
UPDATE public.orders SET status='Listo para recogida' WHERE id=:'o';
SELECT test.run('FLUJO D1 acepta', 'authenticated', :'d1', format($q$ SELECT public.accept_order(%L, %L) $q$, :'o', :'d1'), false);
SELECT test.run('FLUJO D2 intenta avanzar la entrega de D1 -> bloqueado', 'authenticated', :'d2', format($q$ SELECT public.update_delivery_status(%L,'Recogido') $q$, :'o'), true);
SELECT test.run('FLUJO anon no puede ejecutarla', 'anon', NULL, format($q$ SELECT public.update_delivery_status(%L,'Recogido') $q$, :'o'), true);
SELECT test.run('FLUJO D1 marca Recogido', 'authenticated', :'d1', format($q$ SELECT public.update_delivery_status(%L,'Recogido') $q$, :'o'), false);
SELECT test.run('FLUJO no se puede retroceder a Asignado', 'authenticated', :'d1', format($q$ SELECT public.update_delivery_status(%L,'Asignado') $q$, :'o'), true);
SELECT test.run('FLUJO estado inventado -> bloqueado', 'authenticated', :'d1', format($q$ SELECT public.update_delivery_status(%L,'Teletransportado') $q$, :'o'), true);
SELECT test.run('FLUJO D1 marca En camino', 'authenticated', :'d1', format($q$ SELECT public.update_delivery_status(%L,'En camino') $q$, :'o'), false);
SELECT test.assert('FLUJO el pedido sigue En curso antes de entregar', (SELECT status FROM public.orders WHERE id=:'o')='En curso');
SELECT test.run('FLUJO D1 marca Entregado', 'authenticated', :'d1', format($q$ SELECT public.update_delivery_status(%L,'Entregado') $q$, :'o'), false);
SELECT test.assert('FLUJO pedido queda Entregado y entrega con fechas',
  (SELECT status FROM public.orders WHERE id=:'o')='Entregado'
  AND (SELECT delivered_at IS NOT NULL AND picked_up_at IS NOT NULL FROM public.deliveries WHERE order_id=:'o'));
SELECT test.run('FLUJO una entrega completada no se reabre', 'authenticated', :'d1', format($q$ SELECT public.update_delivery_status(%L,'En camino') $q$, :'o'), true);
