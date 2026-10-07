-- =============================================================================
-- AmiOriente · Auditoría de esquema y seguridad (SOLO LECTURA)
-- =============================================================================
-- Esta consulta NO modifica nada. Devuelve UNA sola celda con un JSON que
-- describe tablas, columnas, políticas RLS, funciones y triggers.
--
-- Cómo usarla:
--   1) Pega el archivo en Supabase → SQL Editor y pulsa "Run".
--   2) Haz clic en la celda del resultado → "Copy" (copia el JSON completo).
--   3) Pégalo en la conversación (o guárdalo en un archivo .json y compártelo).
--
-- No incluye datos de usuarios, solo la estructura. Con esto se audita:
--   · qué tablas no tienen RLS o no tienen políticas,
--   · qué políticas son demasiado abiertas (por ejemplo USING (true)),
--   · cómo se calculan los totales y comisiones en funciones y triggers.
-- =============================================================================

SELECT jsonb_pretty(jsonb_build_object(

  'generado', now(),

  -- Tablas del esquema public y si tienen RLS activado
  'tablas', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tabla', c.relname,
        'rls_activo', c.relrowsecurity,
        'rls_forzado', c.relforcerowsecurity
      ) ORDER BY c.relname), '[]'::jsonb)
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  ),

  -- Columnas
  'columnas', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tabla', table_name,
        'columna', column_name,
        'tipo', data_type,
        'nulo', is_nullable,
        'defecto', column_default
      ) ORDER BY table_name, ordinal_position), '[]'::jsonb)
    FROM information_schema.columns
    WHERE table_schema = 'public'
  ),

  -- Claves foráneas
  'claves_foraneas', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tabla', conrelid::regclass::text,
        'definicion', pg_get_constraintdef(oid)
      ) ORDER BY conrelid::regclass::text), '[]'::jsonb)
    FROM pg_constraint
    WHERE contype = 'f' AND connamespace = 'public'::regnamespace
  ),

  -- Políticas RLS (el corazón de la auditoría de seguridad)
  'politicas_rls', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tabla', tablename,
        'politica', policyname,
        'comando', cmd,
        'roles', roles,
        'using', qual,
        'with_check', with_check
      ) ORDER BY tablename, policyname), '[]'::jsonb)
    FROM pg_policies
    WHERE schemaname = 'public'
  ),

  -- Funciones propias (incluye si son SECURITY DEFINER y su código)
  'funciones', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'funcion', p.proname,
        'argumentos', pg_get_function_arguments(p.oid),
        'security_definer', p.prosecdef,
        'definicion', pg_get_functiondef(p.oid)
      ) ORDER BY p.proname), '[]'::jsonb)
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prokind = 'f'
  ),

  -- Triggers
  'triggers', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tabla', c.relname,
        'trigger', t.tgname,
        'definicion', pg_get_triggerdef(t.oid)
      ) ORDER BY c.relname, t.tgname), '[]'::jsonb)
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE NOT t.tgisinternal AND c.relnamespace = 'public'::regnamespace
  ),

  -- Índices
  'indices', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tabla', tablename,
        'indice', indexname,
        'definicion', indexdef
      ) ORDER BY tablename, indexname), '[]'::jsonb)
    FROM pg_indexes
    WHERE schemaname = 'public'
  ),

  -- Permisos directos de los roles de la API sobre las tablas
  'permisos_api', (
    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tabla', table_name,
        'rol', grantee,
        'permiso', privilege_type
      ) ORDER BY table_name, grantee, privilege_type), '[]'::jsonb)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
  ),

  -- Tablas con RLS activo pero SIN ninguna política (nadie puede leerlas)
  'rls_sin_politicas', (
    SELECT coalesce(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind = 'r'
      AND c.relrowsecurity
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public' AND p.tablename = c.relname
      )
  ),

  -- Tablas SIN RLS (cualquiera con la clave anon podría leerlas/escribirlas)
  'sin_rls', (
    SELECT coalesce(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  )

)) AS esquema_amioriente;
