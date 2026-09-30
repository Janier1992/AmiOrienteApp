import { createClient } from '@supabase/supabase-js';

// Configuración vía variables de entorno (ver .env.example).
// Los valores por defecto mantienen el proyecto funcionando sin .env; la clave
// anon es pública por diseño (la seguridad real depende de las políticas RLS).
const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL || 'https://vgpvczyeyqmicuwjkczh.supabase.co';
const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHZjenlleXFtaWN1d2prY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5Mjk0MDYsImV4cCI6MjA2ODUwNTQwNn0.EVCWmGQPtr9Pug0b-t6my-DBm72iMTYVZnnqBaObzrY';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export {
    customSupabaseClient,
    customSupabaseClient as supabase,
};
