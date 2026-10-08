-- Equipos de trabajo, planes y comisiones (se ejecuta sobre la base "después").
\set own '00000000-0000-0000-0000-0000000000b1'
\set adm '00000000-0000-0000-0000-0000000000a1'
\set emp '00000000-0000-0000-0000-0000000000c1'
\set cus '00000000-0000-0000-0000-0000000000c2'
\set drv '00000000-0000-0000-0000-0000000000d1'
\set out '00000000-0000-0000-0000-0000000000f1'
\set sec '00000000-0000-0000-0000-0000000000f2'
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 (:'out', 'afuera@t.co',  '{"role":"cliente","full_name":"Persona Afuera"}'),
 (:'sec', 'segundo@t.co', '{"role":"cliente","full_name":"Segundo Colaborador"}');
SELECT id AS sid FROM public.stores WHERE owner_id = :'own' \gset
INSERT INTO public.products(id, store_id, name, price, stock) VALUES ('00000000-0000-0000-0000-00000000aa01', :'sid', 'Producto comisión', 10000, 100) ON CONFLICT DO NOTHING;
INSERT INTO public.orders(id, customer_id, store_id, status, total) VALUES
 ('00000000-0000-0000-0000-00000000bb01', :'cus', :'sid', 'Pendiente', 10000) ON CONFLICT DO NOTHING;

SELECT test.assert('EQUIPO planes cargados (basic/pro/enterprise)', (SELECT count(*) FROM public.plans)=3);
SELECT test.assert('EQUIPO el dueño es miembro admin y el plan inicial es Básico',
  (SELECT role FROM public.store_members WHERE store_id=:'sid' AND user_id=:'own')='admin'
  AND (SELECT plan_id FROM public.subscriptions WHERE store_id=:'sid')='basic');
SELECT test.run('PLANES anon puede ver los planes (página de precios)', 'anon', NULL, 'SELECT * FROM public.plans', false);
SELECT test.run('PLANES un usuario NO puede editar precios', 'authenticated', :'own', $q$ UPDATE public.plans SET commission_percent = 0 WHERE id='basic' $q$, true);
SELECT test.run('PLANES un usuario NO puede cambiarse de plan con UPDATE directo', 'authenticated', :'own', format($q$ UPDATE public.subscriptions SET plan_id='pro' WHERE store_id=%L $q$, :'sid'), false);
SELECT test.assert('PLANES ...y el plan sigue Básico', (SELECT plan_id FROM public.subscriptions WHERE store_id=:'sid')='basic');

-- permisos del equipo
SELECT test.run('EQUIPO persona ajena NO puede agregar miembros', 'authenticated', :'out', format($q$ SELECT public.add_store_member(%L,'c1@t.co','editor') $q$, :'sid'), true);
SELECT test.run('EQUIPO persona ajena NO puede ver el equipo', 'authenticated', :'out', format($q$ SELECT * FROM public.get_store_team(%L) $q$, :'sid'), true);
SELECT test.run('EQUIPO anon NO puede ejecutar add_store_member', 'anon', NULL, format($q$ SELECT public.add_store_member(%L,'c1@t.co','editor') $q$, :'sid'), true);
SELECT test.run('EQUIPO correo inexistente -> error claro', 'authenticated', :'own', format($q$ SELECT public.add_store_member(%L,'nadie@t.co','editor') $q$, :'sid'), true);
SELECT test.run('EQUIPO un domiciliario no puede ser miembro', 'authenticated', :'own', format($q$ SELECT public.add_store_member(%L,'d1@t.co','editor') $q$, :'sid'), true);
SELECT test.run('EQUIPO rol inválido -> bloqueado', 'authenticated', :'own', format($q$ SELECT public.add_store_member(%L,'c1@t.co','superadmin') $q$, :'sid'), true);
SELECT test.run('EQUIPO insertar directo en store_members -> bloqueado', 'authenticated', :'own', format($q$ INSERT INTO public.store_members(store_id,user_id,role) VALUES (%L,%L,'admin') $q$, :'sid', :'out'), true);
SELECT test.run('EQUIPO dueño agrega un editor (cupo del plan Básico: 2)', 'authenticated', :'own', format($q$ SELECT public.add_store_member(%L,'C1@T.CO','editor') $q$, :'sid'), false);
SELECT test.run('EQUIPO duplicado -> bloqueado', 'authenticated', :'own', format($q$ SELECT public.add_store_member(%L,'c1@t.co','editor') $q$, :'sid'), true);
SELECT test.run('PLANES tercer miembro en plan Básico -> bloqueado por límite', 'authenticated', :'own', format($q$ SELECT public.add_store_member(%L,'segundo@t.co','editor') $q$, :'sid'), true);

-- el editor opera el negocio
UPDATE public.orders SET status='Pendiente' WHERE id='00000000-0000-0000-0000-00000000bb01';
SELECT test.run('EQUIPO editor actualiza el estado de un pedido', 'authenticated', :'emp', $q$ UPDATE public.orders SET status='Confirmado' WHERE id='00000000-0000-0000-0000-00000000bb01' $q$, false);
SELECT test.assert('EQUIPO ...y el cambio se guardó', (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000bb01')='Confirmado');
SELECT test.run('EQUIPO editor crea un producto', 'authenticated', :'emp', format($q$ INSERT INTO public.products(store_id,name,price,stock) VALUES (%L,'Hecho por el equipo',5000,3) $q$, :'sid'), false);
SELECT test.run('EQUIPO editor ve el equipo', 'authenticated', :'emp', format($q$ SELECT * FROM public.get_store_team(%L) $q$, :'sid'), false);
SELECT test.run('EQUIPO editor NO puede agregar miembros', 'authenticated', :'emp', format($q$ SELECT public.add_store_member(%L,'segundo@t.co','editor') $q$, :'sid'), true);
SELECT test.run('EQUIPO editor NO puede subirse a admin', 'authenticated', :'emp', format($q$ SELECT public.update_store_member_role(%L,%L,'admin') $q$, :'sid', :'emp'), true);
SELECT test.run('EQUIPO editor NO puede quitar al dueño', 'authenticated', :'emp', format($q$ SELECT public.remove_store_member(%L,%L) $q$, :'sid', :'own'), true);
-- la protección de pedidos sigue valiendo para quien no es del equipo
UPDATE public.orders SET status='Pendiente' WHERE id='00000000-0000-0000-0000-00000000bb01';
SELECT test.run('SEGURIDAD persona ajena intenta cambiar un pedido (RLS lo ignora)', 'authenticated', :'out', $q$ UPDATE public.orders SET status='Entregado' WHERE id='00000000-0000-0000-0000-00000000bb01' $q$, false);
SELECT test.assert('SEGURIDAD ...y el pedido no cambió', (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000bb01')='Pendiente');
SELECT test.run('SEGURIDAD el cliente sigue sin poder alterar su total (A3)', 'authenticated', :'cus', $q$ UPDATE public.orders SET total=0 WHERE id='00000000-0000-0000-0000-00000000bb01' $q$, true);
SELECT test.run('EQUIPO el editor ve el perfil de un cliente del negocio', 'authenticated', :'emp', $q$ DO $d$ BEGIN IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000c2') THEN RAISE EXCEPTION 'no lo ve'; END IF; END $d$ $q$, false);
SELECT test.run('SEGURIDAD una persona ajena NO ve el perfil de ese cliente', 'authenticated', :'out', $q$ DO $d$ BEGIN IF EXISTS (SELECT 1 FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000c2') THEN RAISE EXCEPTION 'lo ve'; END IF; END $d$ $q$, false);

-- comisión según el plan
INSERT INTO public.order_items(order_id, product_id, quantity, price) VALUES ('00000000-0000-0000-0000-00000000bb01','00000000-0000-0000-0000-00000000aa01', 2, 10000);
SELECT test.assert('COMISIÓN plan Básico = 10 % (antes 22 % fijo)',
  (SELECT commission_rate FROM public.transactions WHERE order_id='00000000-0000-0000-0000-00000000bb01' ORDER BY created_at DESC LIMIT 1)=0.10
  AND (SELECT commission_fee FROM public.transactions WHERE order_id='00000000-0000-0000-0000-00000000bb01' ORDER BY created_at DESC LIMIT 1)=2000);

-- cambio de plan: solo el admin de la plataforma
SELECT test.run('PLANES el dueño NO puede cambiar su plan con la función de admin', 'authenticated', :'own', format($q$ SELECT public.admin_set_store_plan(%L,'pro') $q$, :'sid'), true);
SELECT test.run('PLANES plan inexistente -> error', 'authenticated', :'adm', format($q$ SELECT public.admin_set_store_plan(%L,'inventado') $q$, :'sid'), true);
SELECT test.run('PLANES el admin de la plataforma sube el negocio a Profesional', 'authenticated', :'adm', format($q$ SELECT public.admin_set_store_plan(%L,'pro') $q$, :'sid'), false);
INSERT INTO public.order_items(order_id, product_id, quantity, price) VALUES ('00000000-0000-0000-0000-00000000bb01','00000000-0000-0000-0000-00000000aa01', 1, 10000);
SELECT test.assert('COMISIÓN plan Profesional = 0 % y el historial anterior no cambia',
  (SELECT count(*) FROM public.transactions WHERE order_id='00000000-0000-0000-0000-00000000bb01' AND commission_rate=0)=1
  AND (SELECT count(*) FROM public.transactions WHERE order_id='00000000-0000-0000-0000-00000000bb01' AND commission_rate=0.10)=1);
SELECT test.run('PLANES con el plan Profesional el dueño agrega un admin', 'authenticated', :'own', format($q$ SELECT public.add_store_member(%L,'segundo@t.co','admin') $q$, :'sid'), false);
SELECT test.run('EQUIPO un admin del equipo agrega otro miembro (segundo ya está; ajeno nuevo)', 'authenticated', :'sec', format($q$ SELECT public.add_store_member(%L,'afuera@t.co','editor') $q$, :'sid'), false);
SELECT test.run('EQUIPO un admin del equipo NO puede quitar al dueño', 'authenticated', :'sec', format($q$ SELECT public.remove_store_member(%L,%L) $q$, :'sid', :'own'), true);
SELECT test.run('EQUIPO cambiar el rol del dueño -> bloqueado', 'authenticated', :'sec', format($q$ SELECT public.update_store_member_role(%L,%L,'editor') $q$, :'sid', :'own'), true);
SELECT test.run('EQUIPO un admin del equipo cambia el rol de un editor', 'authenticated', :'sec', format($q$ SELECT public.update_store_member_role(%L,%L,'admin') $q$, :'sid', :'emp'), false);
SELECT test.assert('EQUIPO ...el rol cambió', (SELECT role FROM public.store_members WHERE store_id=:'sid' AND user_id=:'emp')='admin');
SELECT test.run('PLANES bajar a Básico con 4 miembros -> bloqueado', 'authenticated', :'adm', format($q$ SELECT public.admin_set_store_plan(%L,'basic') $q$, :'sid'), true);
SELECT test.run('EQUIPO un miembro puede salirse por su cuenta', 'authenticated', :'out', format($q$ SELECT public.remove_store_member(%L,%L) $q$, :'sid', :'out'), false);
SELECT test.assert('EQUIPO ...ya no figura en el equipo', NOT EXISTS (SELECT 1 FROM public.store_members WHERE store_id=:'sid' AND user_id=:'out'));
SELECT test.run('EQUIPO el dueño no puede salirse del equipo', 'authenticated', :'own', format($q$ SELECT public.remove_store_member(%L,%L) $q$, :'sid', :'own'), true);
SELECT test.run('EQUIPO el dueño quita a un colaborador', 'authenticated', :'own', format($q$ SELECT public.remove_store_member(%L,%L) $q$, :'sid', :'sec'), false);
SELECT test.run('EQUIPO persona removida ya no ve el equipo', 'authenticated', :'sec', format($q$ SELECT * FROM public.get_store_team(%L) $q$, :'sid'), true);
SELECT test.run('EQUIPO persona removida ya no puede cambiar pedidos', 'authenticated', :'sec', $q$ UPDATE public.orders SET status='Entregado' WHERE id='00000000-0000-0000-0000-00000000bb01' $q$, false);
SELECT test.assert('EQUIPO ...el pedido no cambió', (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000bb01')='Pendiente');
