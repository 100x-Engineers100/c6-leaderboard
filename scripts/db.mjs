import { config } from 'dotenv'
import { join } from 'path'
// Load .env.local from project root (works when run as: node scripts/db.mjs from project root)
config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const url = process.env.LEADERBOARD_SUPABASE_URL
const key = process.env.LEADERBOARD_SUPABASE_SERVICE_KEY

if (!url || !key) {
  throw new Error('[ERROR] LEADERBOARD_SUPABASE_URL and LEADERBOARD_SUPABASE_SERVICE_KEY must be set in .env.local')
}

export const db = createClient(url, key, {
  auth: { persistSession: false },
})
