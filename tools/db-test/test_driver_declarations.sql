-- Declaración firmada del domiciliario (se ejecuta sobre la base "después").
\set sig '''data:image/png;base64,' `printf 'A%.0s' $(seq 1 400)` ''''
\set txt '''' `printf 'Texto de la declaración. %.0s' $(seq 1 12)` ''''
\set dd1 '00000000-0000-0000-0000-00000000dd01'
SELECT test.run('DECL anon firma antes de tener cuenta', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('DD1@T.co','Dora Domi','CC','12345678','{"vehiculo":"moto"}'::jsonb,%L,%L,'2026-10-09') $q$, :txt, :sig), false);
SELECT id AS did FROM public.driver_declarations WHERE email='dd1@t.co' \gset
SELECT test.assert('DECL queda sin vincular, con correo normalizado y huella SHA-256 de 64 caracteres',
  (SELECT user_id IS NULL AND claimed_at IS NULL AND char_length(document_hash)=64 FROM public.driver_declarations WHERE id=:'did'));
SELECT test.assert('DECL la huella coincide con el contenido guardado',
  (SELECT document_hash = encode(sha256(convert_to(document_text||'|'||payload::text||'|'||signature_png||'|'||legal_version,'UTF8')),'hex') FROM public.driver_declarations WHERE id=:'did'));

-- validaciones
SELECT test.run('DECL firma demasiado corta -> rechazada', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('x@t.co','X','CC','1','{}'::jsonb,%L,'data:image/png;base64,AAA','v') $q$, :txt), true);
SELECT test.run('DECL firma que no es PNG -> rechazada', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('x@t.co','X','CC','1','{}'::jsonb,%L,%L,'v') $q$, :txt, replace(:sig,'image/png','text/html')), true);
SELECT test.run('DECL correo inválido -> rechazado', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('no-es-correo','X','CC','1','{}'::jsonb,%L,%L,'v') $q$, :txt, :sig), true);
SELECT test.run('DECL texto del documento demasiado corto -> rechazado', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('x@t.co','X','CC','1','{}'::jsonb,'corto',%L,'v') $q$, :sig), true);
SELECT test.run('DECL datos que no son un objeto -> rechazados', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('x@t.co','X','CC','1','[1,2]'::jsonb,%L,%L,'v') $q$, :txt, :sig), true);
SELECT test.run('DECL sin número de documento -> rechazado', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('x@t.co','X','CC','','{}'::jsonb,%L,%L,'v') $q$, :txt, :sig), true);

-- vinculación al crear la cuenta
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 (:'dd1', 'dd1@t.co', format('{"role":"domiciliario","declaration_id":"%s","accepted_terms":"true"}', :'did')::jsonb);
SELECT test.assert('DECL al crear la cuenta con el mismo correo se vincula automáticamente',
  (SELECT user_id=:'dd1' AND claimed_at IS NOT NULL FROM public.driver_declarations WHERE id=:'did'));

SELECT test.run('DECL otra anon firma para usar un correo distinto', 'anon', NULL,
  format($q$ SELECT public.submit_driver_declaration('otro@t.co','Otro Domi','CC','999','{}'::jsonb,%L,%L,'2026-10-09') $q$, :txt, :sig), false);
SELECT id AS did2 FROM public.driver_declarations WHERE email='otro@t.co' \gset
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-00000000dd02', 'intruso@t.co', format('{"role":"domiciliario","declaration_id":"%s"}', :'did2')::jsonb),
 ('00000000-0000-0000-0000-00000000dd03', 'basura@t.co', '{"role":"domiciliario","declaration_id":"no-es-uuid"}'),
 ('00000000-0000-0000-0000-00000000dd04', 'otro@t.co', format('{"role":"cliente","declaration_id":"%s"}', :'did2')::jsonb);
SELECT test.assert('DECL con el identificador pero OTRO correo no se vincula',
  (SELECT user_id IS NULL FROM public.driver_declarations WHERE id=:'did2'));
SELECT test.assert('DECL identificador basura no rompe el registro',
  EXISTS (SELECT 1 FROM public.profiles WHERE id='00000000-0000-0000-0000-00000000dd03'));
SELECT test.assert('DECL una cuenta de cliente no puede reclamar una declaración',
  (SELECT user_id IS NULL FROM public.driver_declarations WHERE id=:'did2'));

-- permisos de lectura y escritura
SELECT test.run('DECL el administrador ve las declaraciones', 'authenticated', '00000000-0000-0000-0000-0000000000a1',
  $q$ DO $d$ BEGIN IF (SELECT count(*) FROM public.driver_declarations) < 2 THEN RAISE EXCEPTION 'no las ve'; END IF; END $d$ $q$, false);
SELECT test.run('DECL el domiciliario ve la suya', 'authenticated', :'dd1',
  $q$ DO $d$ BEGIN IF (SELECT count(*) FROM public.driver_declarations) <> 1 THEN RAISE EXCEPTION 'no ve solo la suya'; END IF; END $d$ $q$, false);
SELECT test.run('DECL otro domiciliario NO ve las ajenas', 'authenticated', '00000000-0000-0000-0000-0000000000d2',
  $q$ DO $d$ BEGIN IF EXISTS (SELECT 1 FROM public.driver_declarations WHERE user_id IS DISTINCT FROM '00000000-0000-0000-0000-0000000000d2') THEN RAISE EXCEPTION 've ajenas'; END IF; END $d$ $q$, false);
SELECT test.run('DECL un cliente NO ve ninguna', 'authenticated', '00000000-0000-0000-0000-0000000000c1',
  $q$ DO $d$ BEGIN IF EXISTS (SELECT 1 FROM public.driver_declarations) THEN RAISE EXCEPTION 've ajenas'; END IF; END $d$ $q$, false);
SELECT test.run('DECL anon no puede leer la tabla', 'anon', NULL, 'SELECT * FROM public.driver_declarations', true);
SELECT test.run('DECL nadie modifica el texto firmado', 'authenticated', :'dd1',
  $q$ UPDATE public.driver_declarations SET document_text='alterado' $q$, true);
SELECT test.run('DECL ni el administrador lo modifica por la API', 'authenticated', '00000000-0000-0000-0000-0000000000a1',
  $q$ UPDATE public.driver_declarations SET document_text='alterado' $q$, true);
SELECT test.run('DECL nadie la borra por la API', 'authenticated', :'dd1', $q$ DELETE FROM public.driver_declarations $q$, true);
SELECT test.run('DECL no se puede insertar directo en la tabla', 'authenticated', :'dd1',
  format($q$ INSERT INTO public.driver_declarations(email,full_name,document_type,document_number,payload,document_text,signature_png,document_hash,legal_version) VALUES ('a@a.co','A','CC','1','{}'::jsonb,'t','s','h','v') $q$), true);

-- con sesión (domiciliario ya registrado)
SELECT test.run('DECL un domiciliario con sesión firma y queda vinculada a él', 'authenticated', '00000000-0000-0000-0000-0000000000d1',
  format($q$ SELECT public.submit_driver_declaration('cualquiera@t.co','Domi Uno','CC','777','{}'::jsonb,%L,%L,'2026-10-09') $q$, :txt, :sig), false);
SELECT test.assert('DECL con sesión se usa el correo y la cuenta reales, no los enviados',
  (SELECT user_id='00000000-0000-0000-0000-0000000000d1' AND email='d1@t.co' AND claimed_at IS NOT NULL FROM public.driver_declarations WHERE document_number='777'));
SELECT test.run('DECL un cliente con sesión NO puede firmar como domiciliario', 'authenticated', '00000000-0000-0000-0000-0000000000c1',
  format($q$ SELECT public.submit_driver_declaration('c1@t.co','Cliente','CC','888','{}'::jsonb,%L,%L,'2026-10-09') $q$, :txt, :sig), true);
