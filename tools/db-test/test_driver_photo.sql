-- Fotografía del domiciliario visible para el cliente (se ejecuta sobre la base "después").
\set photo '''data:image/jpeg;base64,' `printf 'B%.0s' $(seq 1 2500)` ''''
\set sig '''data:image/png;base64,' `printf 'A%.0s' $(seq 1 400)` ''''
\set txt '''' `printf 'Texto de la declaración. %.0s' $(seq 1 12)` ''''
\set dp1 '00000000-0000-0000-0000-00000000dc01'
\set d1 '00000000-0000-0000-0000-0000000000d1'
\set own '00000000-0000-0000-0000-0000000000b1'
\set adm '00000000-0000-0000-0000-0000000000a1'

SELECT test.run('FOTO anon firma con foto antes de tener cuenta', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration_v2('dp1@t.co','Pablo Foto','CC','5550001234','{"vehicleType":"moto","plate":"XYZ98A"}'::jsonb,%L,%L,'v1',%L) $q$, :txt, :sig, :photo), false);
SELECT id AS pdid FROM public.driver_declarations WHERE email='dp1@t.co' \gset
SELECT test.assert('FOTO la foto queda en la declaración y la huella la incluye',
  (SELECT photo_jpeg IS NOT NULL AND document_hash = encode(sha256(convert_to(document_text||'|'||payload::text||'|'||signature_png||'|'||legal_version||'|'||photo_jpeg,'UTF8')),'hex')
     FROM public.driver_declarations WHERE id=:'pdid'));

-- validaciones de la foto
SELECT test.run('FOTO que no es JPEG -> rechazada', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration_v2('x@t.co','X','CC','1','{}'::jsonb,%L,%L,'v',%L) $q$, :txt, :sig, replace(:photo,'jpeg','svg+xml')), true);
SELECT test.run('FOTO demasiado pequeña -> rechazada', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration_v2('x@t.co','X','CC','1','{}'::jsonb,%L,%L,'v','data:image/jpeg;base64,AAAA') $q$, :txt, :sig), true);
SELECT test.run('FOTO ausente -> rechazada', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration_v2('x@t.co','X','CC','1','{}'::jsonb,%L,%L,'v',NULL) $q$, :txt, :sig), true);
SELECT test.run('FOTO con contenido inyectado -> rechazada', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration_v2('x@t.co','X','CC','1','{}'::jsonb,%L,%L,'v',%L) $q$, :txt, :sig, :photo || '" onerror="x'), true);

-- al crear la cuenta, la foto pasa a ser la foto visible
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 (:'dp1', 'dp1@t.co', format('{"role":"domiciliario","declaration_id":"%s"}', :'pdid')::jsonb);
SELECT test.assert('FOTO al vincular la cuenta queda como foto de perfil', EXISTS (SELECT 1 FROM public.driver_photos WHERE user_id=:'dp1'));

-- el domiciliario actualiza su foto
SELECT test.run('FOTO el domiciliario puede cambiar su foto', 'authenticated', :'dp1',
  format($q$ SELECT public.update_driver_photo(%L) $q$, replace(:photo,'BBBB','CCCC')), false);
SELECT test.assert('FOTO ...y el cambio se guardó', (SELECT photo_jpeg LIKE '%CCCC%' FROM public.driver_photos WHERE user_id=:'dp1'));
SELECT test.run('FOTO un cliente NO puede poner foto de domiciliario', 'authenticated', '00000000-0000-0000-0000-0000000000c1',
  format($q$ SELECT public.update_driver_photo(%L) $q$, :photo), true);
SELECT test.run('FOTO anon NO puede ejecutar update_driver_photo', 'anon', NULL,
  format($q$ SELECT public.update_driver_photo(%L) $q$, :photo), true);
SELECT test.run('FOTO foto inválida al actualizar -> rechazada', 'authenticated', :'dp1',
  $q$ SELECT public.update_driver_photo('data:image/jpeg;base64,AAAA') $q$, true);
SELECT test.run('FOTO nadie escribe driver_photos directo', 'authenticated', :'dp1',
  $q$ UPDATE public.driver_photos SET photo_jpeg='x' $q$, true);

-- qué ve el cliente de su pedido
SELECT customer_id AS oc FROM public.orders WHERE id='00000000-0000-0000-0000-00000000f003' \gset
SELECT id AS other_c FROM public.profiles WHERE role='cliente' AND id <> :'oc' AND id NOT IN (SELECT user_id FROM public.store_members) LIMIT 1 \gset
SELECT test.assert('FOTO el pedido de prueba tiene domiciliario asignado', EXISTS (SELECT 1 FROM public.deliveries WHERE order_id='00000000-0000-0000-0000-00000000f003'));
SELECT test.run('FOTO el cliente ve a su domiciliario (nombre, foto, documento enmascarado)', 'authenticated', :'oc',
  $q$ DO $d$ DECLARE r record; BEGIN
        SELECT * INTO r FROM public.get_order_driver('00000000-0000-0000-0000-00000000f003');
        IF r.full_name IS NULL OR r.photo_jpeg IS NULL OR r.document_masked !~ '^CC \*+[0-9]{1,4}$' THEN RAISE EXCEPTION 'datos incompletos: %', r; END IF;
      END $d$ $q$, false);
SELECT test.run('FOTO el documento completo NO se entrega al cliente', 'authenticated', :'oc',
  $q$ DO $d$ DECLARE r record; n text; BEGIN
        SELECT * INTO r FROM public.get_order_driver('00000000-0000-0000-0000-00000000f003');
        SELECT document_number INTO n FROM public.driver_declarations WHERE user_id='00000000-0000-0000-0000-0000000000d1' LIMIT 1;
        IF position(n in r.document_masked) > 0 THEN RAISE EXCEPTION 'documento completo expuesto'; END IF;
      END $d$ $q$, false);
SELECT test.run('FOTO otro cliente NO puede ver al domiciliario de un pedido ajeno', 'authenticated', :'other_c',
  $q$ SELECT * FROM public.get_order_driver('00000000-0000-0000-0000-00000000f003') $q$, true);
SELECT test.run('FOTO la tienda del pedido sí lo ve', 'authenticated', :'own',
  $q$ SELECT * FROM public.get_order_driver('00000000-0000-0000-0000-00000000f003') $q$, false);
SELECT test.run('FOTO el administrador lo ve', 'authenticated', :'adm',
  $q$ SELECT * FROM public.get_order_driver('00000000-0000-0000-0000-00000000f003') $q$, false);
SELECT test.run('FOTO anon NO ve nada', 'anon', NULL,
  $q$ SELECT * FROM public.get_order_driver('00000000-0000-0000-0000-00000000f003') $q$, true);
SELECT test.run('FOTO un pedido sin domiciliario asignado devuelve vacío (sin error)', 'authenticated', :'own',
  $q$ DO $d$ BEGIN IF EXISTS (SELECT 1 FROM public.get_order_driver('00000000-0000-0000-0000-00000000f004')) THEN RAISE EXCEPTION 'no debería haber domiciliario'; END IF; END $d$ $q$, false);
SELECT test.run('FOTO el cliente no puede leer driver_photos directamente', 'authenticated', :'oc',
  $q$ DO $d$ BEGIN IF EXISTS (SELECT 1 FROM public.driver_photos) THEN RAISE EXCEPTION 'lee fotos ajenas'; END IF; END $d$ $q$, false);
