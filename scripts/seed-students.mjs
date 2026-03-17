/**
 * seed-students.mjs
 * One-time: seed C7 students from CSV into leaderboard DB.
 * Reads name/email from C7 Launchpad CSV.
 * Reads avatar_url from Images CSV (join by email).
 * Matches ugc_user_id from UGC tracker by email.
 *
 * Run: node scripts/seed-students.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.mjs'
import { ugcDb } from './ugc-db.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')

// --- CSV parser (handles quoted fields with embedded newlines/commas) ---
function parseCSV(text) {
  const rows = []
  let row = []
  let cell = ''
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cell += '"'; i++ }
      else inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      row.push(cell.trim()); cell = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim()); cell = ''
      if (row.some(c => c)) rows.push(row)
      row = []
    } else {
      cell += ch
    }
  }
  if (row.some(c => c)) { row.push(cell.trim()); rows.push(row) }
  return rows
}

// --- Load C7 Launchpad CSV ---
// Columns: 0=Name, 1=Email (headers have embedded newlines, skip header row)
// Deduplicates by email — keeps first occurrence (earlier signup)
function loadRoster() {
  const text = readFileSync(resolve(ROOT, 'docs/C7 Launchpad  - Sheet1.csv'), 'utf8')
  const rows = parseCSV(text)
  const seen = new Map() // email -> student (dedup, first-wins)
  let dupes = 0
  for (let i = 1; i < rows.length; i++) {
    const name = rows[i][0]?.replace(/\n/g, ' ').trim()
    const email = rows[i][1]?.replace(/\n/g, '').trim().toLowerCase()
    if (!name || !email || !email.includes('@')) continue
    if (seen.has(email)) { dupes++; continue }
    seen.set(email, { name, email })
  }
  if (dupes > 0) console.log(`[WARN] Skipped ${dupes} duplicate email(s) in roster CSV`)
  return [...seen.values()]
}

// --- Load Images CSV ---
// Columns: 3=name, 4=email, 10=avatar_url
function loadAvatars() {
  const text = readFileSync(resolve(ROOT, 'docs/Images -  Launch Pad C7 - Sheet1.csv'), 'utf8')
  const rows = parseCSV(text)
  const map = new Map() // email -> avatar_url
  for (let i = 1; i < rows.length; i++) {
    const email = rows[i][4]?.trim().toLowerCase()
    const avatar = rows[i][10]?.trim()
    if (email && avatar) map.set(email, avatar)
  }
  return map
}

// --- Main ---
async function main() {
  console.log('[*] Loading CSV files...')
  const roster = loadRoster()
  const avatarMap = loadAvatars()
  console.log(`[OK] Roster: ${roster.length} students | Avatars: ${avatarMap.size} entries`)

  // Load C7 UGC users: try DB first, fall back to exported CSV
  console.log('[*] Fetching UGC C7 user IDs...')
  const ugcMap = new Map() // email -> ugc user id

  const { data: ugcUsers, error: ugcErr } = await ugcDb
    .from('User')
    .select('id, email')
    .eq('cohortId', '4c8458b3-a700-42b2-9cc1-f52b3045e2c3')

  if (ugcErr) {
    console.warn('[WARN] UGC DB fetch failed:', ugcErr.message)
    // Fallback: read from exported CSV if available
    const csvPath = resolve(ROOT, 'docs/User_rows_ugc.csv')
    try {
      const text = readFileSync(csvPath, 'utf8')
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',')
      const idIdx    = headers.indexOf('id')
      const emailIdx = headers.indexOf('email')
      let loaded = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',')
        const id    = cols[idIdx]?.trim()
        const email = cols[emailIdx]?.trim().toLowerCase()
        if (id && email) { ugcMap.set(email, id); loaded++ }
      }
      console.log(`[OK] Loaded ${loaded} UGC users from CSV fallback`)
    } catch {
      console.warn('[WARN] CSV fallback not found — ugc_user_id will be null')
    }
  } else {
    for (const u of ugcUsers ?? []) {
      if (u.email) ugcMap.set(u.email.toLowerCase(), u.id)
    }
    console.log(`[OK] UGC C7 users found: ${ugcMap.size}`)
  }

  // Build upsert payload
  const rows = roster.map(({ name, email }) => ({
    name,
    email,
    avatar_url: avatarMap.get(email) ?? null,
    ugc_user_id: ugcMap.get(email) ?? null,
    cohort: 'C7',
  }))

  console.log('[*] Upserting students...')
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await db
      .from('students')
      .upsert(batch, { onConflict: 'email' })
    if (error) { console.error('[ERROR] Upsert failed:', error.message); process.exit(1) }
    inserted += batch.length
    console.log(`  --> ${inserted}/${rows.length}`)
  }

  // Create student_points rows for all new students
  console.log('[*] Initialising student_points rows...')
  const { data: allStudents, error: fetchErr } = await db
    .from('students')
    .select('id')
    .eq('cohort', 'C7')
  if (fetchErr) { console.error('[ERROR]', fetchErr.message); process.exit(1) }

  const pointRows = allStudents.map(s => ({ student_id: s.id }))
  const { error: ptErr } = await db
    .from('student_points')
    .upsert(pointRows, { onConflict: 'student_id', ignoreDuplicates: true })
  if (ptErr) console.warn('[WARN] student_points init:', ptErr.message)

  // Summary
  const withAvatar = rows.filter(r => r.avatar_url).length
  const withUgc = rows.filter(r => r.ugc_user_id).length
  const unmatched = roster.filter(r => !ugcMap.has(r.email)).map(r => r.email)
  console.log(`\n[OK] Done.`)
  console.log(`     Students seeded : ${rows.length}`)
  console.log(`     With avatar     : ${withAvatar}`)
  console.log(`     Matched UGC     : ${withUgc}`)
  if (unmatched.length) {
    console.log(`\n[WARN] ${unmatched.length} students not matched to UGC:`)
    unmatched.slice(0, 10).forEach(e => console.log('  -', e))
    if (unmatched.length > 10) console.log(`  ... and ${unmatched.length - 10} more`)
  }
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
