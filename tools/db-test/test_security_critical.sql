-- =============================================================================
-- Pruebas de seguridad críticas (A1–A4) sobre la réplica del esquema.
-- Variables psql:  :attack  = true  -> la base es vulnerable (estado ANTES): los
--                                      ataques deben FUNCIONAR.
--                             false -> corregida (DESPUÉS): los ataques deben FALLAR.
--                  :after   = true cuando ya se aplicó la migración (habilita
--                             pruebas de accept_order endurecida).
-- Los flujos legítimos deben funcionar en AMBOS estados.
-- =============================================================================
\set ON_ERROR_STOP off
CREATE SCHEMA IF NOT EXISTS test;
DROP TABLE IF EXISTS test.results;
CREATE TABLE test.results(n serial, label text, ok boolean, detail text);

-- Ejecuta una sentencia COMO un rol/usuario de la API y comprueba si falla o no.
CREATE OR REPLACE FUNCTION test.run(label text, role_name text, uid uuid, stmt text, expect_error boolean)
RETURNS void LANGUAGE plpgsql AS $f$
DECLARE err text := NULL;
BEGIN
  BEGIN
    PERFORM set_config('request.jwt.claim.sub', coalesce(uid::text, ''), true);
    EXECUTE format('SET LOCAL ROLE %I', role_name);
    EXECUTE stmt;
    RESET ROLE;
  EXCEPTION WHEN OTHERS THEN
    err := SQLERRM;
  END;
  RESET ROLE;
  INSERT INTO test.results(label, ok, detail) VALUES (label, (err IS NOT NULL) = expect_error,
     CASE WHEN err IS NULL THEN 'sin error' ELSE left(err, 90) END);
END $f$;

CREATE OR REPLACE FUNCTION test.assert(label text, cond boolean) RETURNS void LANGUAGE sql AS
$f$ INSERT INTO test.results(label, ok, detail) VALUES (label, coalesce(cond, false), CASE WHEN coalesce(cond,false) THEN 'ok' ELSE 'NO se cumple' END) $f$;

-- ----------------------------- datos de partida ------------------------------
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-0000000000a1', 'admin@t.co',  '{"role":"cliente"}'),
 ('00000000-0000-0000-0000-0000000000c1', 'c1@t.co',     '{"role":"cliente","full_name":"Cliente Uno"}'),
 ('00000000-0000-0000-0000-0000000000c2', 'c2@t.co',     '{"role":"cliente","full_name":"Cliente Dos"}'),
 ('00000000-0000-0000-0000-0000000000b1', 'owner@t.co',  '{"role":"tienda","store_name":"Tienda Test","service_category":"Restaurante","category":"Restaurante","address":"Calle 1"}'),
 ('00000000-0000-0000-0000-0000000000d1', 'd1@t.co',     '{"role":"domiciliario","full_name":"Domi Uno"}'),
 ('00000000-0000-0000-0000-0000000000d2', 'd2@t.co',     '{"role":"domiciliario","full_name":"Domi Dos"}');
UPDATE public.profiles SET role = 'admin' WHERE id = '00000000-0000-0000-0000-0000000000a1';  -- como postgres

INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) SELECT
  '00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-0000000000c1', s.id, 'Pendiente de pago en efectivo', 50000, 'Calle 10' FROM public.stores s;
INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) SELECT
  '00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000c1', s.id, 'En preparación', 40000, 'Calle 11' FROM public.stores s;
INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) SELECT
  '00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000c2', s.id, 'Listo para recogida', 30000, 'Calle 12' FROM public.stores s;
INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) SELECT
  '00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-0000000000c2', s.id, 'Pendiente', 20000, 'Calle 13' FROM public.stores s;
INSERT INTO public.orders(id, customer_id, store_id, status, total, delivery_address) SELECT
  '00000000-0000-0000-0000-00000000f005', '00000000-0000-0000-0000-0000000000b1', s.id, 'Confirmado', 99000, '{"guest":"x"}' FROM public.stores s;  -- reserva de hotel (dueño como cliente)

-- ============================ A1 · registro como admin =======================
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-0000000000e1', 'evil@t.co', '{"role":"admin"}');
SELECT test.assert('A1 registro con role=admin ' || CASE WHEN :attack THEN '(vulnerable: nace admin)' ELSE '-> queda como cliente' END,
   (SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000e1') = CASE WHEN :attack THEN 'admin' ELSE 'cliente' END);
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-0000000000e2', 'cult@t.co', '{"role":"cultivador","store_name":"X"}');
SELECT test.assert('A1 rol no público (cultivador) ' || CASE WHEN :attack THEN '(vulnerable: se acepta)' ELSE '-> cliente' END,
   (SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000e2') = CASE WHEN :attack THEN 'cultivador' ELSE 'cliente' END);
-- Registros legítimos conservan su rol
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-0000000000e3', 'okc@t.co', '{"role":"cliente"}'),
 ('00000000-0000-0000-0000-0000000000e4', 'okd@t.co', '{"role":"domiciliario"}'),
 ('00000000-0000-0000-0000-0000000000e5', 'okt@t.co', '{"role":"tienda","store_name":"Otra Tienda","service_category":"Restaurante","category":"Restaurante"}');
SELECT test.assert('LEGÍTIMO registro de cliente conserva rol', (SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000e3')='cliente');
SELECT test.assert('LEGÍTIMO registro de domiciliario conserva rol', (SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000e4')='domiciliario');
SELECT test.assert('LEGÍTIMO registro de tienda crea perfil y negocio con suscripción',
   (SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000e5')='tienda'
   AND EXISTS (SELECT 1 FROM public.stores WHERE owner_id='00000000-0000-0000-0000-0000000000e5')
   AND EXISTS (SELECT 1 FROM public.subscriptions su JOIN public.stores s ON s.id=su.store_id WHERE s.owner_id='00000000-0000-0000-0000-0000000000e5'));

-- ============================ A2 · escalada vía perfil =======================
SELECT test.run('A2 usuario se pone role=admin en su perfil ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.profiles SET role = 'admin' WHERE id = '00000000-0000-0000-0000-0000000000c1' $q$, NOT :attack);
SELECT test.assert('A2 el rol del usuario ' || CASE WHEN :attack THEN 'cambió (vulnerable)' ELSE 'no cambió' END,
  (SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000c1') = CASE WHEN :attack THEN 'admin' ELSE 'cliente' END);
UPDATE public.profiles SET role = 'cliente' WHERE id = '00000000-0000-0000-0000-0000000000c1';  -- restaurar (postgres)
SELECT test.run('A2 usuario intenta cambiar su id de perfil -> falla',
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.profiles SET id = '00000000-0000-0000-0000-0000000000ff' WHERE id = '00000000-0000-0000-0000-0000000000c1' $q$, true);
SELECT test.run('LEGÍTIMO usuario edita nombre, teléfono y dirección de su perfil', 'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.profiles SET full_name='Cliente Uno B', phone='3001112233', address='Calle 99' WHERE id = '00000000-0000-0000-0000-0000000000c1' $q$, false);
SELECT test.assert('LEGÍTIMO el cambio de perfil se guardó', (SELECT phone FROM public.profiles WHERE id='00000000-0000-0000-0000-0000000000c1')='3001112233');
-- (Los cambios de rol los hace el admin desde el SQL Editor / service_role, no por API: ninguna política RLS lo permite.)

-- ============================ A3 · pedidos ===================================
SELECT test.run('A3 cliente pone total=0 en su pedido ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.orders SET total = 0 WHERE id = '00000000-0000-0000-0000-00000000f001' $q$, NOT :attack);
SELECT test.assert('A3 total del pedido ' || CASE WHEN :attack THEN 'quedó en 0 (vulnerable)' ELSE 'intacto (50000)' END,
  (SELECT total FROM public.orders WHERE id='00000000-0000-0000-0000-00000000f001') = CASE WHEN :attack THEN 0 ELSE 50000 END);
UPDATE public.orders SET total = 50000 WHERE id='00000000-0000-0000-0000-00000000f001';
SELECT test.run('A3 cliente marca su pedido como Entregado ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.orders SET status = 'Entregado' WHERE id = '00000000-0000-0000-0000-00000000f001' $q$, NOT :attack);
UPDATE public.orders SET status = 'Pendiente de pago en efectivo' WHERE id='00000000-0000-0000-0000-00000000f001';
SELECT test.run('A3 cliente se aplica descuento de 99999 ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.orders SET discount_amount = 99999, delivery_fee = 0 WHERE id = '00000000-0000-0000-0000-00000000f001' $q$, NOT :attack);
UPDATE public.orders SET discount_amount = 0, delivery_fee = 0 WHERE id='00000000-0000-0000-0000-00000000f001';
SELECT test.run('A3 cliente crea un pedido ya Entregado ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ INSERT INTO public.orders(customer_id, store_id, status, total) SELECT '00000000-0000-0000-0000-0000000000c1', id, 'Entregado', 1 FROM public.stores LIMIT 1 $q$, NOT :attack);
SELECT test.run('A3 cliente cancela un pedido YA en preparación ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.orders SET status = 'Cancelado' WHERE id = '00000000-0000-0000-0000-00000000f002' $q$, NOT :attack);
UPDATE public.orders SET status = 'En preparación' WHERE id='00000000-0000-0000-0000-00000000f002';
-- Un cliente no puede tocar el pedido de otro (RLS: 0 filas, sin efecto)
SELECT test.run('A3 cliente C2 intenta tocar el pedido de C1 (sin efecto)', 'authenticated', '00000000-0000-0000-0000-0000000000c2',
  $q$ UPDATE public.orders SET total = 1 WHERE id = '00000000-0000-0000-0000-00000000f001' $q$, false);
SELECT test.assert('A3 el pedido de C1 sigue intacto tras el intento de C2', (SELECT total FROM public.orders WHERE id='00000000-0000-0000-0000-00000000f001')=50000);
-- LEGÍTIMO cliente
SELECT test.run('LEGÍTIMO cliente crea un pedido pendiente', 'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ INSERT INTO public.orders(customer_id, store_id, status, total, delivery_address, payment_method) SELECT '00000000-0000-0000-0000-0000000000c1', id, 'Pendiente de pago en efectivo', 12000, 'Calle 5', 'efectivo' FROM public.stores LIMIT 1 $q$, false);
SELECT test.run('LEGÍTIMO cliente cancela su pedido pendiente', 'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ UPDATE public.orders SET status = 'Cancelado' WHERE id = '00000000-0000-0000-0000-00000000f001' $q$, false);
SELECT test.assert('LEGÍTIMO el pedido quedó Cancelado', (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000f001')='Cancelado');
-- LEGÍTIMO dueño de tienda
SELECT test.run('LEGÍTIMO dueño confirma un pedido', 'authenticated', '00000000-0000-0000-0000-0000000000b1',
  $q$ UPDATE public.orders SET status = 'Confirmado' WHERE id = '00000000-0000-0000-0000-00000000f004' $q$, false);
SELECT test.run('LEGÍTIMO dueño pasa un pedido a Listo para recogida', 'authenticated', '00000000-0000-0000-0000-0000000000b1',
  $q$ UPDATE public.orders SET status = 'Listo para recogida' WHERE id = '00000000-0000-0000-0000-00000000f002' $q$, false);
SELECT test.run('LEGÍTIMO dueño edita una reserva de hotel (payload con total y datos)', 'authenticated', '00000000-0000-0000-0000-0000000000b1',
  $q$ UPDATE public.orders SET store_id = o.store_id, customer_id = o.customer_id, status='Confirmado', total=120000, delivery_address='{"guest":"y"}' FROM public.orders o WHERE public.orders.id='00000000-0000-0000-0000-00000000f005' AND o.id='00000000-0000-0000-0000-00000000f005' $q$, false);
SELECT test.run('LEGÍTIMO dueño registra una venta POS ya cerrada', 'authenticated', '00000000-0000-0000-0000-0000000000b1',
  $q$ INSERT INTO public.orders(customer_id, store_id, status, total) SELECT NULL, id, 'Entregado', 5000 FROM public.stores WHERE owner_id='00000000-0000-0000-0000-0000000000b1' $q$, false);
SELECT test.run('A3 dueño intenta reasignar el cliente de un pedido -> bloqueado', 'authenticated', '00000000-0000-0000-0000-0000000000b1',
  $q$ UPDATE public.orders SET customer_id = '00000000-0000-0000-0000-0000000000c1' WHERE id = '00000000-0000-0000-0000-00000000f004' $q$, :after);

-- ============================ A4 · accept_order ==============================
SELECT test.run('A4 usuario SIN sesión (anon) ejecuta accept_order ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'anon', NULL,
  $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d1') $q$, NOT :attack);
SELECT test.assert('A4 el pedido de anon ' || CASE WHEN :attack THEN 'pasó a En curso (vulnerable)' ELSE 'no cambió' END,
  (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000f003') = CASE WHEN :attack THEN 'En curso' ELSE 'Listo para recogida' END);
UPDATE public.orders SET status='Listo para recogida' WHERE id='00000000-0000-0000-0000-00000000f003';
DELETE FROM public.deliveries;
SELECT test.run('A4 un CLIENTE ejecuta accept_order ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000c1') $q$, NOT :attack);
UPDATE public.orders SET status='Listo para recogida' WHERE id='00000000-0000-0000-0000-00000000f003';
DELETE FROM public.deliveries;
SELECT test.run('A4 un domiciliario acepta A NOMBRE DE OTRO ' || CASE WHEN :attack THEN '(vulnerable)' ELSE '-> bloqueado' END,
  'authenticated', '00000000-0000-0000-0000-0000000000d1',
  $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d2') $q$, NOT :attack);
UPDATE public.orders SET status='Listo para recogida' WHERE id='00000000-0000-0000-0000-00000000f003';
DELETE FROM public.deliveries;

\if :after
  SELECT test.run('DECL un domiciliario SIN declaración firmada no puede aceptar -> bloqueado', 'authenticated', '00000000-0000-0000-0000-0000000000d1',
    $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d1') $q$, true);
  SELECT test.assert('DECL ...y el pedido no cambió', (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000f003')='Listo para recogida');
  SELECT test.run('DECL el administrador tampoco puede asignarle un pedido sin declaración', 'authenticated', '00000000-0000-0000-0000-0000000000a1',
    $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d1') $q$, true);
  -- Las declaraciones de D1 y D2 (como las crearía submit_driver_declaration con sesión)
  INSERT INTO public.driver_declarations (user_id, email, full_name, document_type, document_number, payload, document_text, signature_png, document_hash, legal_version, claimed_at)
  SELECT id, email, 'Domi', 'CC', '1' || right(id::text, 4), '{}'::jsonb, repeat('texto ', 40), 'data:image/png;base64,' || repeat('A', 400), repeat('0', 64), 'test', now()
    FROM public.profiles WHERE id IN ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2');
  SELECT test.run('FOTO un domiciliario con declaración pero SIN foto no puede aceptar -> bloqueado', 'authenticated', '00000000-0000-0000-0000-0000000000d1',
    $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d1') $q$, true);
  INSERT INTO public.driver_photos (user_id, photo_jpeg)
  SELECT id, 'data:image/jpeg;base64,' || repeat('A', 2500) FROM public.profiles WHERE id IN ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2');
  SELECT test.run('LEGÍTIMO domiciliario D1 acepta un pedido listo', 'authenticated', '00000000-0000-0000-0000-0000000000d1',
    $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d1') $q$, false);
  SELECT test.assert('LEGÍTIMO la entrega queda Asignada a D1 y el pedido En curso',
    (SELECT d.status||'/'||d.delivery_person_id FROM public.deliveries d WHERE d.order_id='00000000-0000-0000-0000-00000000f003')='Asignado/00000000-0000-0000-0000-0000000000d1'
    AND (SELECT status FROM public.orders WHERE id='00000000-0000-0000-0000-00000000f003')='En curso');
  SELECT test.run('A4 otro domiciliario (D2) intenta quitarle el pedido a D1 -> bloqueado', 'authenticated', '00000000-0000-0000-0000-0000000000d2',
    $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-0000000000d2') $q$, true);
  SELECT test.assert('A4 la entrega sigue siendo de D1', (SELECT delivery_person_id FROM public.deliveries WHERE order_id='00000000-0000-0000-0000-00000000f003')='00000000-0000-0000-0000-0000000000d1');
  SELECT test.run('A4 aceptar un pedido ya Confirmado por la tienda (no disponible) -> bloqueado', 'authenticated', '00000000-0000-0000-0000-0000000000d2',
    $q$ SELECT public.accept_order('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-0000000000d2') $q$, true);
\endif

\if :after
  \ir test_delivery_flow.sql
  \ir test_teams_plans.sql
  \ir test_legal_consents.sql
  \ir test_driver_declarations.sql
  \ir test_driver_photo.sql
\endif

-- ================================= resultado =================================
\echo
\echo '================ RESULTADO ================'
SELECT n, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS r, label, detail FROM test.results ORDER BY n;
SELECT count(*) FILTER (WHERE ok) AS pasan, count(*) FILTER (WHERE NOT ok) AS fallan FROM test.results;
