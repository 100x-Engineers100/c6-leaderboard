import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Lazy: only throws at request time, not at build/module-load time
export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const url = process.env.LEADERBOARD_SUPABASE_URL
  const key = process.env.LEADERBOARD_SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error('LEADERBOARD_SUPABASE_URL and LEADERBOARD_SUPABASE_SERVICE_KEY must be set')
  }
  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}
