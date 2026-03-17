import { config } from 'dotenv'
config({ path: '.env.local' })
const BASE_URL = process.env.EDMINGLE_BASE_URL?.replace(/\/$/, '')
const API_KEY  = process.env.EDMINGLE_API_KEY
const ORG_ID   = process.env.EDMINGLE_ORG_ID
const CLASS_ID = process.env.C7_CLASS_ID || '446933'
const start = 1740000000, end = Math.floor(Date.now()/1000)

if (!BASE_URL || !API_KEY || !ORG_ID) {
  throw new Error('[ERROR] EDMINGLE_BASE_URL, EDMINGLE_API_KEY, EDMINGLE_ORG_ID must be set')
}

const url = `${BASE_URL}/report/csv?apikey=${API_KEY}&ORGID=${ORG_ID}&report_type=20&start=${start}&end=${end}&class_id=${CLASS_ID}`
const res = await fetch(url, { headers: { apikey: API_KEY, ORGID: ORG_ID } })
const text = await res.text()
console.log(`status: ${res.status}`)
console.log(text.split('\n').slice(0, 20).join('\n'))
