import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

const url = process.env.UGC_SUPABASE_URL
const key = process.env.UGC_SUPABASE_SERVICE_KEY

if (!url || !key) {
  throw new Error('[ERROR] UGC_SUPABASE_URL and UGC_SUPABASE_SERVICE_KEY must be set in .env.local')
}

export const ugcDb = createClient(url, key, {
  auth: { persistSession: false },
})
