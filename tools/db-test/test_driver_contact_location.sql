-- Botón «Llamar» y privacidad de la ubicación (se ejecuta sobre la base "después").
-- Usa test.rows_as y los usuarios de test_order_chat.sql.
\set cu '00000000-0000-0000-0000-0000000000c1'
\set cu2 '00000000-0000-0000-0000-0000000000c2'
\set dr '00000000-0000-0000-0000-0000000000d3'
\set dr2 '00000000-0000-0000-0000-0000000000d2'
\set own '00000000-0000-0000-0000-0000000000b1'
\set adm '00000000-0000-0000-0000-0000000000a1'
\set oa '00000000-0000-0000-0000-00000000cf01'
\set ob '00000000-0000-0000-0000-00000000cf02'

INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES (:'dr', 'd3@t.co', '{"role":"domiciliario","full_name":"Domi Tres"}');
UPDATE public.profiles SET phone = '3001234567', full_name = 'Ana María Cliente' WHERE id = :'cu';
SELECT id AS sid FROM public.stores WHERE owner_id = :'own' \gset
INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) VALUES
 (:'oa', :'cu', :'sid', 'En curso', 1000, 'Calle A'),
 (:'ob', :'cu', :'sid', 'En curso', 1000, 'Calle B');
INSERT INTO public.deliveries(order_id, delivery_person_id, status, delivery_address) VALUES
 (:'oa', :'dr', 'Recogido', 'Calle A'),
 (:'ob', :'dr', 'Recogido', 'Calle B');

-- ---------------------------- «Llamar» ----------------------------
SELECT test.assert('LLAMAR anon no ejecuta get_order_customer_contact', NOT has_function_privilege('anon','public.get_order_customer_contact(uuid)','EXECUTE'));
SELECT test.assert('LLAMAR el domiciliario NO puede leer perfiles directamente (no se abrió profiles)',
  test.rows_as('authenticated', :'dr', format('SELECT 1 FROM public.profiles WHERE id=%L', :'cu'))=0);
SELECT test.assert('LLAMAR el domiciliario asignado recibe nombre de pila y teléfono',
  test.rows_as('authenticated', :'dr', format('SELECT 1 FROM public.get_order_customer_contact(%L) WHERE first_name=''Ana'' AND phone=''3001234567''', :'oa'))=1);
SELECT test.assert('LLAMAR otro domiciliario no recibe nada', test.rows_as('authenticated', :'dr2', format('SELECT 1 FROM public.get_order_customer_contact(%L)', :'oa'))=0);
SELECT test.assert('LLAMAR el propio cliente y el dueño de la tienda no reciben nada por esta función',
  test.rows_as('authenticated', :'cu', format('SELECT 1 FROM public.get_order_customer_contact(%L)', :'oa'))=0
  AND test.rows_as('authenticated', :'own', format('SELECT 1 FROM public.get_order_customer_contact(%L)', :'oa'))=0);
SELECT test.run('LLAMAR anon NO puede llamarla', 'anon', NULL, format($q$ SELECT * FROM public.get_order_customer_contact(%L) $q$, :'oa'), true);

-- ---------------------------- ubicación ----------------------------
INSERT INTO public.delivery_locations(delivery_person_id, lat, lng) VALUES (:'dr', 6.15, -75.37), (:'dr2', 6.20, -75.40);

SELECT test.assert('UBIC anon ya no tiene permisos sobre la tabla',
  NOT has_table_privilege('anon','public.delivery_locations','SELECT') AND NOT has_table_privilege('anon','public.delivery_locations','INSERT'));
SELECT test.assert('UBIC el cliente ve la posición de su domiciliario con el pedido En curso (y solo la suya)',
  test.rows_as('authenticated', :'cu', 'SELECT 1 FROM public.delivery_locations')=1);
SELECT test.assert('UBIC otro cliente no ve ninguna posición', test.rows_as('authenticated', :'cu2', 'SELECT 1 FROM public.delivery_locations')=0);
SELECT test.assert('UBIC cada domiciliario solo ve la suya',
  test.rows_as('authenticated', :'dr2', 'SELECT 1 FROM public.delivery_locations')=1
  AND test.rows_as('authenticated', :'dr', 'SELECT 1 FROM public.delivery_locations')=1);

-- limpieza de posiciones sin entrega en curso (dr2 no tiene ninguna)
SELECT public.clear_idle_driver_locations() AS limpiadas \gset
SELECT test.assert('UBIC la limpieza borra la posición de quien no tiene entrega en curso y conserva la de quien sí',
  :limpiadas = 1 AND EXISTS (SELECT 1 FROM public.delivery_locations WHERE delivery_person_id=:'dr')
  AND NOT EXISTS (SELECT 1 FROM public.delivery_locations WHERE delivery_person_id=:'dr2'));
SELECT test.assert('UBIC nadie puede ejecutar la limpieza desde la app',
  NOT has_function_privilege('authenticated','public.clear_idle_driver_locations()','EXECUTE'));

-- al cerrar un pedido, si el domiciliario aún tiene otro en curso, su posición se conserva
UPDATE public.orders SET status = 'Entregado' WHERE id = :'oa';
SELECT test.assert('UBIC al entregar un pedido, con otro en curso la posición se conserva',
  EXISTS (SELECT 1 FROM public.delivery_locations WHERE delivery_person_id=:'dr'));
-- al cerrar el último, se borra
UPDATE public.orders SET status = 'Cancelado' WHERE id = :'ob';
SELECT test.assert('UBIC al cerrar su último pedido en curso, la posición se borra',
  NOT EXISTS (SELECT 1 FROM public.delivery_locations WHERE delivery_person_id=:'dr'));
SELECT test.assert('UBIC y el cliente ya no ve ninguna posición',
  test.rows_as('authenticated', :'cu', 'SELECT 1 FROM public.delivery_locations')=0);
SELECT test.assert('LLAMAR cerrado el pedido, el domiciliario ya no recibe el teléfono',
  test.rows_as('authenticated', :'dr', format('SELECT 1 FROM public.get_order_customer_contact(%L)', :'oa'))=0);

-- el domiciliario sigue pudiendo guardar su propia posición
SELECT test.run('UBIC el domiciliario puede guardar su posición', 'authenticated', :'dr',
  format($q$ INSERT INTO public.delivery_locations(delivery_person_id, lat, lng) VALUES (%L, 6.1, -75.3) ON CONFLICT (delivery_person_id) DO UPDATE SET lat=EXCLUDED.lat $q$, :'dr'), false);
SELECT test.run('UBIC y NO puede guardar la posición de otro', 'authenticated', :'dr',
  format($q$ INSERT INTO public.delivery_locations(delivery_person_id, lat, lng) VALUES (%L, 6.1, -75.3) $q$, :'dr2'), true);
