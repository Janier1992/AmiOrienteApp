-- =============================================================================
-- AmiOriente · Auditoría de esquema y seguridad (SOLO LECTURA)
-- =============================================================================
-- NO modifica nada. Devuelve una fila por sección (seccion | datos) con la
-- estructura de la base: tablas y RLS, columnas, políticas, funciones, triggers.
--
-- Cómo usarla:
--   1) Pégala en Supabase → SQL Editor y pulsa "Run".
--   2) En la tabla de resultados usa "Copy" → "Copy as JSON" (o descarga el CSV)
--      y pásame el resultado completo.
--
-- No incluye datos de usuarios, solo estructura.
-- (Sin punto y coma final a propósito: algunos editores envuelven la consulta.)
-- =============================================================================

SELECT 'tablas' AS seccion,
       coalesce(jsonb_agg(jsonb_build_object(
           'tabla', c.relname,
           'rls_activo', c.relrowsecurity,
           'rls_forzado', c.relforcerowsecurity
       ) ORDER BY c.relname), '[]'::jsonb) AS datos
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'r'

UNION ALL
SELECT 'columnas',
       coalesce(jsonb_agg(jsonb_build_object(
           'tabla', table_name,
           'columna', column_name,
           'tipo', data_type,
           'nulo', is_nullable,
           'defecto', column_default
       ) ORDER BY table_name, ordinal_position), '[]'::jsonb)
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL
SELECT 'claves_foraneas',
       coalesce(jsonb_agg(jsonb_build_object(
           'tabla', conrelid::regclass::text,
           'definicion', pg_get_constraintdef(oid)
       ) ORDER BY conrelid::regclass::text), '[]'::jsonb)
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'public'::regnamespace

UNION ALL
SELECT 'politicas_rls',
       coalesce(jsonb_agg(jsonb_build_object(
           'tabla', tablename,
           'politica', policyname,
           'comando', cmd,
           'roles', roles,
           'using', qual,
           'with_check', with_check
       ) ORDER BY tablename, policyname), '[]'::jsonb)
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL
SELECT 'funciones',
       coalesce(jsonb_agg(jsonb_build_object(
           'funcion', p.proname,
           'argumentos', pg_get_function_arguments(p.oid),
           'security_definer', p.prosecdef,
           'definicion', pg_get_functiondef(p.oid)
       ) ORDER BY p.proname), '[]'::jsonb)
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f'
  -- solo funciones propias, no las que instalan las extensiones
  AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')

UNION ALL
SELECT 'triggers',
       coalesce(jsonb_agg(jsonb_build_object(
           'tabla', c.relname,
           'trigger', t.tgname,
           'definicion', pg_get_triggerdef(t.oid)
       ) ORDER BY c.relname, t.tgname), '[]'::jsonb)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal AND c.relnamespace = 'public'::regnamespace

UNION ALL
SELECT 'indices',
       coalesce(jsonb_agg(jsonb_build_object(
           'tabla', tablename,
           'indice', indexname,
           'definicion', indexdef
       ) ORDER BY tablename, indexname), '[]'::jsonb)
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL
SELECT 'permisos_api',
       coalesce(jsonb_agg(jsonb_build_object(
           'tabla', table_name,
           'rol', grantee,
           'permiso', privilege_type
       ) ORDER BY table_name, grantee, privilege_type), '[]'::jsonb)
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')

UNION ALL
SELECT 'rls_sin_politicas',
       coalesce(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND c.relrowsecurity
  AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = c.relname
  )

UNION ALL
SELECT 'sin_rls',
       coalesce(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
