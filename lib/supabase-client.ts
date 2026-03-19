import { createBrowserClient } from '@supabase/ssr'

export function getSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_LEADERBOARD_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LEADERBOARD_SUPABASE_ANON_KEY!
  )
}
