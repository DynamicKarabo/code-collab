import { createClient } from '@supabase/supabase-js';

// Fallback values prevent the app from crashing immediately if env vars are missing.
// The Auth component checks isSupabaseConfigured() before attempting to use the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && url.length > 0 && key.length > 0;
};