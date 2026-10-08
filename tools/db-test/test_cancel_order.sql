-- Cancelar pedidos (se ejecuta sobre la base "después").
\set own '00000000-0000-0000-0000-0000000000b1'
\set adm '00000000-0000-0000-0000-0000000000a1'
\set cu '00000000-0000-0000-0000-00000000ca01'
\set cu2 '00000000-0000-0000-0000-00000000ca02'
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 (:'cu', 'cancel1@t.co', '{"role":"cliente"}'), (:'cu2', 'cancel2@t.co', '{"role":"cliente"}');
SELECT id AS sid FROM public.stores WHERE owner_id = :'own' \gset
INSERT INTO public.products(id, store_id, name, price, stock) VALUES ('00000000-0000-0000-0000-00000000ca10', :'sid', 'Producto cancelable', 1000, 10) ON CONFLICT DO NOTHING;
UPDATE public.products SET stock = 10 WHERE id = '00000000-0000-0000-0000-00000000ca10';
INSERT INTO public.orders(id, customer_id, store_id, status, total) VALUES
 ('00000000-0000-0000-0000-00000000cb01', :'cu', :'sid', 'Pendiente', 3000),
 ('00000000-0000-0000-0000-00000000cb02', :'cu', :'sid', 'En preparación', 3000),
 ('00000000-0000-0000-0000-00000000cb03', :'cu', :'sid', 'En curso', 3000),
 ('00000000-0000-0000-0000-00000000cb04', :'cu', :'sid', 'Confirmado', 3000),
 ('00000000-0000-0000-0000-00000000cb05', :'cu', :'sid', 'Entregado', 3000);
INSERT INTO public.order_items(order_id, product_id, quantity, price)
SELECT o, '00000000-0000-0000-0000-00000000ca10', 3, 1000 FROM (VALUES
 ('00000000-0000-0000-0000-00000000cb01'::uuid),('00000000-0000-0000-0000-00000000cb02'),('00000000-0000-0000-0000-00000000cb03'),('00000000-0000-0000-0000-00000000cb04'),('00000000-0000-0000-0000-00000000cb05')) t(o);
-- (en la réplica no hay trigger de existencias: simulamos que ya se descontaron las 5 x 3)
UPDATE public.products SET stock = 10 - 15 + 15 WHERE id = '00000000-0000-0000-0000-00000000ca10';

SELECT test.run('CANCEL el cliente cancela su pedido pendiente', 'authenticated', :'cu',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb01', 'Me equivoqué de dirección') $q$, false);
SELECT test.assert('CANCEL queda cancelado con fecha y motivo',
  (SELECT status='Cancelado' AND cancelled_at IS NOT NULL AND cancellation_reason='Me equivoqué de dirección' FROM public.orders WHERE id='00000000-0000-0000-0000-00000000cb01'));
SELECT test.assert('CANCEL devuelve las 3 unidades al inventario', (SELECT stock FROM public.products WHERE id='00000000-0000-0000-0000-00000000ca10')=13);
SELECT test.run('CANCEL cancelar dos veces -> bloqueado (no se infla el inventario)', 'authenticated', :'cu',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb01', NULL) $q$, true);
SELECT test.assert('CANCEL el inventario no cambió con el segundo intento', (SELECT stock FROM public.products WHERE id='00000000-0000-0000-0000-00000000ca10')=13);
SELECT test.run('CANCEL la función antigua tampoco permite repetir', 'authenticated', :'own',
  $q$ SELECT public.cancel_order_and_restock('00000000-0000-0000-0000-00000000cb01') $q$, true);

SELECT test.run('CANCEL el cliente NO cancela un pedido que ya se está preparando', 'authenticated', :'cu',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb02', NULL) $q$, true);
SELECT test.run('CANCEL el cliente NO cancela un pedido en curso', 'authenticated', :'cu',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb03', NULL) $q$, true);
SELECT test.run('CANCEL nadie cancela un pedido entregado', 'authenticated', :'own',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb05', NULL) $q$, true);
SELECT test.run('CANCEL otro cliente NO puede cancelar un pedido ajeno', 'authenticated', :'cu2',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb04', NULL) $q$, true);
SELECT test.run('CANCEL anon NO puede cancelar', 'anon', NULL,
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb04', NULL) $q$, true);
SELECT test.assert('CANCEL los pedidos bloqueados siguen igual',
  (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000cb02')='En preparación'
  AND (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000cb04')='Confirmado');

SELECT test.run('CANCEL la tienda cancela un pedido en preparación', 'authenticated', :'own',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb02', 'Se acabó el producto') $q$, false);
SELECT test.assert('CANCEL ...y el inventario vuelve a subir', (SELECT stock FROM public.products WHERE id='00000000-0000-0000-0000-00000000ca10')=16);
SELECT test.run('CANCEL el administrador puede cancelar', 'authenticated', :'adm',
  $q$ SELECT public.cancel_order('00000000-0000-0000-0000-00000000cb04', 'x') $q$, false);
SELECT test.run('CANCEL el motivo se recorta a 300 caracteres', 'authenticated', :'cu',
  $q$ DO $d$ BEGIN
       INSERT INTO public.orders(id, customer_id, store_id, status, total) SELECT '00000000-0000-0000-0000-00000000cb06', '00000000-0000-0000-0000-00000000ca01', id, 'Pendiente', 1 FROM public.stores WHERE owner_id='00000000-0000-0000-0000-0000000000b1';
       PERFORM public.cancel_order('00000000-0000-0000-0000-00000000cb06', repeat('x', 1000));
       IF (SELECT char_length(cancellation_reason) FROM public.orders WHERE id='00000000-0000-0000-0000-00000000cb06') <> 300 THEN RAISE EXCEPTION 'no se recortó'; END IF;
     END $d$ $q$, false);

SELECT test.assert('REALTIME la tabla de pedidos está publicada para avisos en vivo',
  EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='orders'));
