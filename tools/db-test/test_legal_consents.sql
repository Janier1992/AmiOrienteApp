-- Autorizaciones legales (se ejecuta sobre la base "después").
INSERT INTO auth.users(id, email, raw_user_meta_data) VALUES
 ('00000000-0000-0000-0000-00000000ab05', 'lc1@t.co', '{"role":"cliente","accepted_terms":"true","legal_version":"2026-10-09"}'),
 ('00000000-0000-0000-0000-00000000ab06', 'lc2@t.co', '{"role":"cliente"}'),
 ('00000000-0000-0000-0000-00000000ab07', 'lc3@t.co', '{"role":"domiciliario","accepted_terms":"true","driver_independent_declared":"true","legal_version":"2026-10-09"}'),
 ('00000000-0000-0000-0000-00000000ab08', 'lc4@t.co', '{"role":"cliente","accepted_terms":"true","driver_independent_declared":"true","legal_version":"v1"}'),
 ('00000000-0000-0000-0000-00000000ab09', 'lc5@t.co', '{"role":"admin","accepted_terms":"true","legal_version":"0123456789012345678901234567890123456789"}');
SELECT test.assert('LEGAL cliente que acepta: queda prueba de Términos y Privacidad con la versión',
  (SELECT string_agg(document||':'||version, ',' ORDER BY document) FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab05')='privacy:2026-10-09,terms:2026-10-09');
SELECT test.assert('LEGAL sin casilla marcada no se inventa una aceptación (y la cuenta se crea)',
  (SELECT count(*) FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab06')=0
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id='00000000-0000-0000-0000-00000000ab06'));
SELECT test.assert('LEGAL domiciliario que declara: 3 registros (incluye la declaración de independencia)',
  (SELECT count(*) FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab07')=3
  AND EXISTS (SELECT 1 FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab07' AND document='driver_independent'));
SELECT test.assert('LEGAL un cliente no puede registrar la declaración de domiciliario',
  NOT EXISTS (SELECT 1 FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab08' AND document='driver_independent'));
SELECT test.assert('LEGAL el rol admin sigue bloqueado en el registro (A1) y la versión se acota a 30 caracteres',
  (SELECT role FROM public.profiles WHERE id='00000000-0000-0000-0000-00000000ab09')='cliente'
  AND (SELECT max(char_length(version)) FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab09')=30);
SELECT test.run('LEGAL la persona ve sus propias autorizaciones', 'authenticated', '00000000-0000-0000-0000-00000000ab05',
  $q$ DO $d$ BEGIN IF (SELECT count(*) FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab05') <> 2 THEN RAISE EXCEPTION 'no ve las suyas'; END IF; END $d$ $q$, false);
SELECT test.run('LEGAL otra persona NO ve las autorizaciones ajenas', 'authenticated', '00000000-0000-0000-0000-00000000ab06',
  $q$ DO $d$ BEGIN IF EXISTS (SELECT 1 FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab05') THEN RAISE EXCEPTION 've las ajenas'; END IF; END $d$ $q$, false);
SELECT test.run('LEGAL nadie puede insertar autorizaciones desde la API', 'authenticated', '00000000-0000-0000-0000-00000000ab06',
  $q$ INSERT INTO public.legal_consents(user_id, document, version) VALUES ('00000000-0000-0000-0000-00000000ab06','terms','x') $q$, true);
SELECT test.run('LEGAL nadie puede modificar autorizaciones', 'authenticated', '00000000-0000-0000-0000-00000000ab05',
  $q$ UPDATE public.legal_consents SET version='falsa' WHERE user_id='00000000-0000-0000-0000-00000000ab05' $q$, true);
SELECT test.run('LEGAL nadie puede borrar autorizaciones', 'authenticated', '00000000-0000-0000-0000-00000000ab05',
  $q$ DELETE FROM public.legal_consents WHERE user_id='00000000-0000-0000-0000-00000000ab05' $q$, true);
SELECT test.run('LEGAL anon no ve nada', 'anon', NULL, 'SELECT * FROM public.legal_consents', true);
