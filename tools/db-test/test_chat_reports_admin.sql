-- Pantalla del administrador para los reportes del chat (se ejecuta sobre la base "después",
-- a continuación de test_order_chat.sql, que define test.rows_as y los usuarios).
\set cu '00000000-0000-0000-0000-0000000000c1'
\set cu2 '00000000-0000-0000-0000-0000000000c2'
\set dr '00000000-0000-0000-0000-0000000000d1'
\set own '00000000-0000-0000-0000-0000000000b1'
\set adm '00000000-0000-0000-0000-0000000000a1'
\set o3 '00000000-0000-0000-0000-00000000ce03'

SELECT id AS sid FROM public.stores WHERE owner_id = :'own' \gset
INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) VALUES (:'o3', :'cu', :'sid', 'En curso', 1000, 'Calle 3');
INSERT INTO public.deliveries(order_id, delivery_person_id, status, delivery_address) VALUES (:'o3', :'dr', 'Recogido', 'Calle 3');
INSERT INTO public.order_messages(order_id, sender_id, sender_role, body) VALUES
 (:'o3', :'cu', 'cliente', 'Hola'), (:'o3', :'dr', 'domiciliario', 'Voy en camino');

SELECT test.assert('REPADM anon no ejecuta el listado ni la resolución',
  NOT has_function_privilege('anon','public.admin_list_order_chat_reports(boolean)','EXECUTE')
  AND NOT has_function_privilege('anon','public.resolve_order_chat_report(uuid,text)','EXECUTE'));

SELECT test.run('REPADM el domiciliario reporta la conversación', 'authenticated', :'dr',
  format($q$ SELECT public.report_order_chat(%L, 'El cliente me insultó') $q$, :'o3'), false);
SELECT id AS rid FROM public.order_chat_reports WHERE order_id = :'o3' \gset

SELECT test.run('REPADM un cliente NO puede listar reportes', 'authenticated', :'cu',
  $q$ SELECT * FROM public.admin_list_order_chat_reports(true) $q$, true);
SELECT test.run('REPADM el dueño de la tienda NO puede listar reportes', 'authenticated', :'own',
  $q$ SELECT * FROM public.admin_list_order_chat_reports(true) $q$, true);
SELECT test.run('REPADM anon NO puede listar reportes', 'anon', NULL,
  $q$ SELECT * FROM public.admin_list_order_chat_reports(true) $q$, true);
SELECT test.run('REPADM el administrador sí puede listar', 'authenticated', :'adm',
  $q$ SELECT * FROM public.admin_list_order_chat_reports(true) $q$, false);

SELECT test.assert('REPADM el listado trae el contexto: quién reportó, negocio, cliente, domiciliario y cuántos mensajes',
  test.rows_as('authenticated', :'adm', format('SELECT 1 FROM public.admin_list_order_chat_reports(true) WHERE order_id=%L AND reporter_role=''domiciliario'' AND message_count=2 AND reason=''El cliente me insultó'' AND store_name IS NOT NULL AND customer_name IS NOT NULL AND driver_name IS NOT NULL', :'o3'))=1);

SELECT test.assert('REPADM con el reporte abierto el administrador lee la conversación',
  test.rows_as('authenticated', :'adm', format('SELECT 1 FROM public.order_messages WHERE order_id=%L', :'o3'))=2);

SELECT test.run('REPADM un cliente NO puede resolver reportes', 'authenticated', :'cu',
  format($q$ SELECT public.resolve_order_chat_report(%L, 'x') $q$, :'rid'), true);
SELECT test.run('REPADM quien reportó NO puede resolver su propio reporte', 'authenticated', :'dr',
  format($q$ SELECT public.resolve_order_chat_report(%L, 'x') $q$, :'rid'), true);
SELECT test.run('REPADM el administrador resuelve con una nota', 'authenticated', :'adm',
  format($q$ SELECT public.resolve_order_chat_report(%L, 'Se advirtió al cliente') $q$, :'rid'), false);
SELECT test.assert('REPADM queda resuelto con fecha, responsable y nota',
  (SELECT resolved_at IS NOT NULL AND resolved_by = :'adm' AND resolution_note = 'Se advirtió al cliente' FROM public.order_chat_reports WHERE id = :'rid'));
SELECT test.run('REPADM resolver dos veces -> error', 'authenticated', :'adm',
  format($q$ SELECT public.resolve_order_chat_report(%L, 'otra vez') $q$, :'rid'), true);
SELECT test.run('REPADM un reporte inexistente -> error', 'authenticated', :'adm',
  $q$ SELECT public.resolve_order_chat_report('00000000-0000-0000-0000-00000000ffff', 'x') $q$, true);

SELECT test.assert('REPADM resuelto: sale del listado de abiertos y aparece en el completo',
  test.rows_as('authenticated', :'adm', format('SELECT 1 FROM public.admin_list_order_chat_reports(true) WHERE order_id=%L', :'o3'))=0
  AND test.rows_as('authenticated', :'adm', format('SELECT 1 FROM public.admin_list_order_chat_reports(false) WHERE order_id=%L', :'o3'))=1);
SELECT test.assert('REPADM resuelto: el administrador deja de poder leer la conversación',
  test.rows_as('authenticated', :'adm', format('SELECT 1 FROM public.order_messages WHERE order_id=%L', :'o3'))=0);
SELECT test.assert('REPADM los participantes siguen viendo su conversación',
  test.rows_as('authenticated', :'cu', format('SELECT 1 FROM public.order_messages WHERE order_id=%L', :'o3'))=2);
