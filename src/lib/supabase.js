import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// DEBUG SOLO IN DEV
if (import.meta.env.DEV) {
  console.debug('SB URL:', supabaseUrl?.slice(0, 35))
console.debug('SB KEY (inizio):', supabaseAnonKey?.slice(0, 6))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
export default supabase