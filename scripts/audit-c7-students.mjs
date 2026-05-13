/**
 * audit-c7-students.mjs
 * 3-way comparison: Leaderboard C7 vs UGC DB C7 vs C7 Full.csv
 * Shows exactly where every discrepancy comes from.
 *
 * Run: node scripts/audit-c7-students.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.mjs'
import { ugcDb } from './ugc-db.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '..')
const C7_COHORT_ID = '4c8458b3-a700-42b2-9cc1-f52b3045e2c3'

// --- Parse C7 Full.csv (col 0=Name, col 1=Email) ---
function loadFullCsv() {
  const text = readFileSync(resolve(ROOT, 'docs/C7 Full.csv'), 'utf8')
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  const seen = new Map()   // email → name
  const dupes = []
  for (const line of lines.slice(1)) {
    const comma = line.indexOf(',')
    if (comma === -1) continue
    const name  = line.slice(0, comma).trim()
    const email = line.slice(comma + 1).trim().toLowerCase()
    if (!email.includes('@')) continue
    if (seen.has(email)) { dupes.push({ email, name }); continue }
    seen.set(email, name)
  }
  return { map: seen, dupes }
}

function sep(title) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(` ${title}`)
  console.log('='.repeat(60))
}

async function main() {
  // --- Load all 3 sources ---
  const { map: csv, dupes: csvDupes } = loadFullCsv()

  const { data: lbStudents, error: lbErr } = await db
    .from('students')
    .select('id, name, email, ugc_user_id')
    .eq('cohort', 'C7')
    .order('email')
  if (lbErr) { console.error('[ERROR] LB fetch:', lbErr.message); process.exit(1) }

  const { data: ugcUsers, error: ugcErr } = await ugcDb
    .from('User')
    .select('id, name, email, linkedinUsername, createdFrom')
    .eq('cohortId', C7_COHORT_ID)
    .order('email')
  if (ugcErr) { console.error('[ERROR] UGC fetch:', ugcErr.message); process.exit(1) }

  // Build lookup maps (lowercase email)
  const lbMap  = new Map(lbStudents.map(s => [s.email.toLowerCase(), s]))
  const ugcMap = new Map(ugcUsers.map(u => [u.email.toLowerCase(), u]))

  sep('SOURCE COUNTS')
  console.log(`C7 Full.csv          : ${csv.size} unique emails (${csvDupes.length} dupes found in CSV)`)
  console.log(`Leaderboard C7       : ${lbStudents.length} students`)
  console.log(`UGC DB C7            : ${ugcUsers.length} users`)

  // --- CSV duplicates ---
  if (csvDupes.length) {
    sep(`CSV DUPLICATES (${csvDupes.length})`)
    csvDupes.forEach(d => console.log(`  ${d.name} <${d.email}>`))
  }

  // --- In Leaderboard but NOT in Full.csv ---
  const lbNotInCsv = lbStudents.filter(s => !csv.has(s.email.toLowerCase()))
  sep(`IN LEADERBOARD, NOT IN FULL.CSV (${lbNotInCsv.length}) — mystery extras`)
  if (lbNotInCsv.length === 0) console.log('  none')
  lbNotInCsv.forEach(s => console.log(`  ${s.name} <${s.email}> ugc_user_id=${s.ugc_user_id ?? 'NULL'}`))

  // --- In UGC but NOT in Full.csv ---
  const ugcNotInCsv = ugcUsers.filter(u => !csv.has(u.email.toLowerCase()))
  sep(`IN UGC DB, NOT IN FULL.CSV (${ugcNotInCsv.length}) — mystery UGC extras`)
  if (ugcNotInCsv.length === 0) console.log('  none')
  ugcNotInCsv.forEach(u => console.log(`  ${u.name} <${u.email}> createdFrom=${u.createdFrom}`))

  // --- In Full.csv but NOT in Leaderboard ---
  const csvNotInLb = [...csv.entries()].filter(([e]) => !lbMap.has(e))
  sep(`IN FULL.CSV, NOT IN LEADERBOARD (${csvNotInLb.length}) — missing from LB`)
  if (csvNotInLb.length === 0) console.log('  none')
  csvNotInLb.forEach(([e, n]) => console.log(`  ${n} <${e}>`))

  // --- In Full.csv but NOT in UGC ---
  const csvNotInUgc = [...csv.entries()].filter(([e]) => !ugcMap.has(e))
  sep(`IN FULL.CSV, NOT IN UGC DB (${csvNotInUgc.length}) — missing from UGC`)
  if (csvNotInUgc.length === 0) console.log('  none')
  csvNotInUgc.forEach(([e, n]) => {
    const lb = lbMap.get(e)
    console.log(`  ${n} <${e}> [in LB: ${lb ? 'yes, ugc_id=' + (lb.ugc_user_id ?? 'NULL') : 'NO'}]`)
  })

  // --- In UGC but NOT in Leaderboard ---
  const ugcNotInLb = ugcUsers.filter(u => !lbMap.has(u.email.toLowerCase()))
  sep(`IN UGC DB, NOT IN LEADERBOARD (${ugcNotInLb.length})`)
  if (ugcNotInLb.length === 0) console.log('  none')
  ugcNotInLb.forEach(u => console.log(`  ${u.name} <${u.email}> createdFrom=${u.createdFrom}`))

  // --- In Leaderboard but NOT in UGC ---
  const lbNotInUgc = lbStudents.filter(s => !ugcMap.has(s.email.toLowerCase()))
  sep(`IN LEADERBOARD, NOT IN UGC DB (${lbNotInUgc.length})`)
  if (lbNotInUgc.length === 0) console.log('  none')
  lbNotInUgc.forEach(s => console.log(`  ${s.name} <${s.email}> ugc_user_id=${s.ugc_user_id ?? 'NULL'}`))

  // --- Link integrity: has ugc_user_id but UGC ID doesn't exist ---
  const linked = lbStudents.filter(s => s.ugc_user_id)
  const ugcIdSet = new Set(ugcUsers.map(u => u.id))
  const brokenLinks = linked.filter(s => !ugcIdSet.has(s.ugc_user_id))
  sep(`BROKEN ugc_user_id LINKS (${brokenLinks.length}) — ID in LB points to nonexistent UGC row`)
  if (brokenLinks.length === 0) console.log('  none')
  brokenLinks.forEach(s => console.log(`  ${s.name} <${s.email}> ugc_user_id=${s.ugc_user_id}`))

  // --- UGC email duplicates ---
  const ugcEmailCount = new Map()
  for (const u of ugcUsers) {
    const e = u.email.toLowerCase()
    ugcEmailCount.set(e, (ugcEmailCount.get(e) || 0) + 1)
  }
  const ugcDupes = [...ugcEmailCount.entries()].filter(([, c]) => c > 1)
  sep(`UGC DB EMAIL DUPLICATES (${ugcDupes.length})`)
  if (ugcDupes.length === 0) console.log('  none')
  ugcDupes.forEach(([e, c]) => {
    const rows = ugcUsers.filter(u => u.email.toLowerCase() === e)
    rows.forEach(u => console.log(`  [${c}x] ${u.name} <${u.email}> id=${u.id} createdFrom=${u.createdFrom}`))
  })

  // --- Leaderboard email duplicates ---
  const lbEmailCount = new Map()
  for (const s of lbStudents) {
    const e = s.email.toLowerCase()
    lbEmailCount.set(e, (lbEmailCount.get(e) || 0) + 1)
  }
  const lbDupes = [...lbEmailCount.entries()].filter(([, c]) => c > 1)
  sep(`LEADERBOARD EMAIL DUPLICATES (${lbDupes.length})`)
  if (lbDupes.length === 0) console.log('  none')
  lbDupes.forEach(([e, c]) => {
    const rows = lbStudents.filter(s => s.email.toLowerCase() === e)
    rows.forEach(s => console.log(`  [${c}x] ${s.name} <${s.email}> id=${s.id} ugc_user_id=${s.ugc_user_id ?? 'NULL'}`))
  })

  sep('SUMMARY')
  console.log(`Full.csv unique       : ${csv.size}`)
  console.log(`Leaderboard           : ${lbStudents.length}  (${lbNotInCsv.length} not in CSV, ${csvNotInLb.length} CSV entries missing from LB)`)
  console.log(`UGC DB                : ${ugcUsers.length}  (${ugcNotInCsv.length} not in CSV, ${csvNotInUgc.length} CSV entries missing from UGC)`)
  console.log(`LB ↔ UGC unlinked     : ${lbNotInUgc.length} in LB not in UGC | ${ugcNotInLb.length} in UGC not in LB`)
  console.log(`Broken ugc_user_id    : ${brokenLinks.length}`)
  console.log(`UGC email dupes       : ${ugcDupes.length}`)
  console.log(`LB email dupes        : ${lbDupes.length}`)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
