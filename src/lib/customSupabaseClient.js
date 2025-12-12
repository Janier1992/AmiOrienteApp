import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vgpvczyeyqmicuwjkczh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHZjenlleXFtaWN1d2prY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5Mjk0MDYsImV4cCI6MjA2ODUwNTQwNn0.EVCWmGQPtr9Pug0b-t6my-DBm72iMTYVZnnqBaObzrY';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
