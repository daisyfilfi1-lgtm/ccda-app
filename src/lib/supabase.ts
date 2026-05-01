import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createClient(cookieHeader?: string) {
  if (cookieHeader) {
    // Server-side / middleware: pass the request cookies
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          cookie: cookieHeader,
        },
      },
    });
  }
  // Client-side: default browser client
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
