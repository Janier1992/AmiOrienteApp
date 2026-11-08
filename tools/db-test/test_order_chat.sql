-- Chat interno cliente ↔ domiciliario (se ejecuta sobre la base "después").
\set cu '00000000-0000-0000-0000-0000000000c1'
\set cu2 '00000000-0000-0000-0000-0000000000c2'
\set dr '00000000-0000-0000-0000-0000000000d1'
\set dr2 '00000000-0000-0000-0000-0000000000d2'
\set own '00000000-0000-0000-0000-0000000000b1'
\set adm '00000000-0000-0000-0000-0000000000a1'
\set oc '00000000-0000-0000-0000-00000000ce01'
\set oc2 '00000000-0000-0000-0000-00000000ce02'

-- Cuántas filas ve un usuario (con las políticas de seguridad aplicadas).
CREATE OR REPLACE FUNCTION test.rows_as(role_name text, uid uuid, q text) RETURNS bigint LANGUAGE plpgsql AS $f$
DECLARE n bigint;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
  EXECUTE format('SET LOCAL ROLE %I', role_name);
  EXECUTE format('SELECT count(*) FROM (%s) t', q) INTO n;
  RESET ROLE;
  RETURN n;
END $f$;

SELECT id AS sid FROM public.stores WHERE owner_id = :'own' \gset
INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) VALUES
 (:'oc',  :'cu',  :'sid', 'En curso', 1000, 'Calle 1'),
 (:'oc2', :'cu2', :'sid', 'Listo para recogida', 1000, 'Calle 2');
INSERT INTO public.deliveries(order_id, delivery_person_id, status, delivery_address) VALUES (:'oc', :'dr', 'Recogido', 'Calle 1');

SELECT test.assert('CHAT anon y authenticated no pueden escribir directo en la tabla',
  NOT has_table_privilege('authenticated','public.order_messages','INSERT') AND NOT has_table_privilege('anon','public.order_messages','SELECT'));
SELECT test.assert('CHAT anon no puede ejecutar send_order_message', NOT has_function_privilege('anon','public.send_order_message(uuid,text)','EXECUTE'));
SELECT test.assert('CHAT nadie puede ejecutar la purga desde la app', NOT has_function_privilege('authenticated','public.purge_old_order_messages()','EXECUTE'));

SELECT test.run('CHAT el cliente escribe en su pedido en curso', 'authenticated', :'cu',
  format($q$ SELECT public.send_order_message(%L, 'Estoy en la portería 2') $q$, :'oc'), false);
SELECT test.run('CHAT el domiciliario asignado responde', 'authenticated', :'dr',
  format($q$ SELECT public.send_order_message(%L, 'Ya llegué') $q$, :'oc'), false);
SELECT test.assert('CHAT cada mensaje guarda el rol correcto de quien escribe',
  (SELECT count(*) FROM public.order_messages WHERE order_id=:'oc' AND ((sender_role='cliente' AND sender_id=:'cu') OR (sender_role='domiciliario' AND sender_id=:'dr')))=2);

SELECT test.run('CHAT otro cliente NO escribe en un pedido ajeno', 'authenticated', :'cu2',
  format($q$ SELECT public.send_order_message(%L, 'hola') $q$, :'oc'), true);
SELECT test.run('CHAT otro domiciliario NO escribe en un pedido que no es suyo', 'authenticated', :'dr2',
  format($q$ SELECT public.send_order_message(%L, 'hola') $q$, :'oc'), true);
SELECT test.run('CHAT la tienda NO escribe en el chat', 'authenticated', :'own',
  format($q$ SELECT public.send_order_message(%L, 'hola') $q$, :'oc'), true);
SELECT test.run('CHAT anon NO escribe', 'anon', NULL,
  format($q$ SELECT public.send_order_message(%L, 'hola') $q$, :'oc'), true);
SELECT test.run('CHAT mensaje vacío -> rechazado', 'authenticated', :'cu',
  format($q$ SELECT public.send_order_message(%L, '   ') $q$, :'oc'), true);
SELECT test.run('CHAT mensaje de más de 500 caracteres -> rechazado', 'authenticated', :'cu',
  format($q$ SELECT public.send_order_message(%L, repeat('x', 501)) $q$, :'oc'), true);
SELECT test.run('CHAT sin domiciliario asignado todavía, el cliente no puede escribir (pedido no en curso)', 'authenticated', :'cu2',
  format($q$ SELECT public.send_order_message(%L, 'hola') $q$, :'oc2'), true);

SELECT test.assert('CHAT el cliente ve los 2 mensajes de su pedido', test.rows_as('authenticated', :'cu', format('SELECT 1 FROM public.order_messages WHERE order_id=%L', :'oc'))=2);
SELECT test.assert('CHAT el domiciliario asignado ve los 2 mensajes', test.rows_as('authenticated', :'dr', 'SELECT 1 FROM public.order_messages')=2);
SELECT test.assert('CHAT otro cliente NO ve nada', test.rows_as('authenticated', :'cu2', 'SELECT 1 FROM public.order_messages')=0);
SELECT test.assert('CHAT otro domiciliario NO ve nada', test.rows_as('authenticated', :'dr2', 'SELECT 1 FROM public.order_messages')=0);
SELECT test.assert('CHAT la tienda NO ve el chat', test.rows_as('authenticated', :'own', 'SELECT 1 FROM public.order_messages')=0);
SELECT test.assert('CHAT el administrador NO lo ve mientras nadie lo reporte', test.rows_as('authenticated', :'adm', 'SELECT 1 FROM public.order_messages')=0);

-- límite de frecuencia: 5 mensajes por 10 segundos
SELECT test.run('CHAT tope de frecuencia (el 6.º mensaje seguido se rechaza)', 'authenticated', :'dr',
  format($q$ DO $d$ BEGIN
       FOR i IN 1..4 LOOP PERFORM public.send_order_message(%L, 'm'||i); END LOOP;
       PERFORM public.send_order_message(%L, 'm5');
     END $d$ $q$, :'oc', :'oc'), true);

-- leído
SELECT test.run('CHAT el cliente marca como leídos los mensajes del domiciliario', 'authenticated', :'cu',
  format($q$ SELECT public.mark_order_messages_read(%L) $q$, :'oc'), false);
SELECT test.assert('CHAT solo se marcan los de la otra parte',
  (SELECT bool_and(read_at IS NOT NULL) FROM public.order_messages WHERE order_id=:'oc' AND sender_id=:'dr')
  AND (SELECT bool_and(read_at IS NULL) FROM public.order_messages WHERE order_id=:'oc' AND sender_id=:'cu'));
SELECT test.run('CHAT un ajeno NO puede marcar como leído', 'authenticated', :'cu2',
  format($q$ SELECT public.mark_order_messages_read(%L) $q$, :'oc'), true);

-- reportar -> el administrador puede leer ese chat
SELECT test.run('CHAT un ajeno NO puede reportar', 'authenticated', :'cu2',
  format($q$ SELECT public.report_order_chat(%L, 'x') $q$, :'oc'), true);
SELECT test.run('CHAT el cliente reporta la conversación', 'authenticated', :'cu',
  format($q$ SELECT public.report_order_chat(%L, 'Me trató mal') $q$, :'oc'), false);
SELECT test.assert('CHAT con un reporte abierto el administrador sí lo ve', test.rows_as('authenticated', :'adm', 'SELECT 1 FROM public.order_messages')>=2);
SELECT test.assert('CHAT el administrador ve el reporte; el otro cliente no', test.rows_as('authenticated', :'adm', 'SELECT 1 FROM public.order_chat_reports')=1
  AND test.rows_as('authenticated', :'cu2', 'SELECT 1 FROM public.order_chat_reports')=0);

-- cierre: al entregar el pedido solo queda lectura
UPDATE public.orders SET status='Entregado', updated_at=now() WHERE id=:'oc';
SELECT test.run('CHAT pedido entregado -> el cliente ya no puede escribir', 'authenticated', :'cu',
  format($q$ SELECT public.send_order_message(%L, 'gracias') $q$, :'oc'), true);
SELECT test.run('CHAT pedido entregado -> el domiciliario ya no puede escribir', 'authenticated', :'dr',
  format($q$ SELECT public.send_order_message(%L, 'de nada') $q$, :'oc'), true);
SELECT test.assert('CHAT pedido entregado -> sigue visible para los participantes (archivo)', test.rows_as('authenticated', :'cu', 'SELECT 1 FROM public.order_messages')>=2);

-- conservación de 30 días
UPDATE public.orders SET updated_at = now() - interval '31 days' WHERE id=:'oc';
SELECT test.assert('CHAT con un reporte abierto NO se borra aunque pasen 30 días', (SELECT public.purge_old_order_messages())=0);
UPDATE public.order_chat_reports SET resolved_at = now() WHERE order_id=:'oc';
SELECT public.purge_old_order_messages() AS borrados \gset
SELECT test.assert('CHAT resuelto el reporte y pasados 30 días, se borra', :borrados >= 2
  AND NOT EXISTS (SELECT 1 FROM public.order_messages WHERE order_id=:'oc'));

SELECT test.assert('REALTIME el chat está publicado para mensajes en vivo',
  EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='order_messages'));
