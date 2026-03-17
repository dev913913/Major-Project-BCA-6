import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase config] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
  throw new Error('Service setup is incomplete. Please try again later.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
