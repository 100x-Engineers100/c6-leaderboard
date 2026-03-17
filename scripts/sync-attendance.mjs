/**
 * sync-attendance.mjs
 * Fetch Edmingle attendance summary CSV for C7, upsert attendance_pts to student_points.
 *
 * Run:
 *   node scripts/sync-attendance.mjs                    # last 14 days
 *   node scripts/sync-attendance.mjs START_TS END_TS    # unix timestamps
 */
import { db } from './db.mjs'

const BASE_URL  = process.env.EDMINGLE_BASE_URL?.replace(/\/$/, '')
const API_KEY   = process.env.EDMINGLE_API_KEY
const ORG_ID    = process.env.EDMINGLE_ORG_ID
const CLASS_ID  = process.env.C7_CLASS_ID || '446933'
const BATCH_ID  = process.env.C7_BATCH_ID || '194294'

if (!BASE_URL || !API_KEY || !ORG_ID) {
  throw new Error('[ERROR] EDMINGLE_BASE_URL, EDMINGLE_API_KEY, EDMINGLE_ORG_ID must be set')
}

// --- Fetch student roster from Edmingle to populate edmingle_id by email ---
async function fetchEdmingleStudents() {
  const url = `${BASE_URL}/organization/students?apikey=${API_KEY}&ORGID=${ORG_ID}&batch_id=${BATCH_ID}&limit=500`
  const res = await fetch(url, { headers: { apikey: API_KEY, ORGID: ORG_ID } })
  if (!res.ok) {
    console.warn('[WARN] Could not fetch Edmingle student roster:', res.status)
    return []
  }
  const json = await res.json()
  const list = Array.isArray(json) ? json : (json.data ?? json.students ?? [])
  return list
}

// --- Parse summary CSV: columns "Learners", "Email", ..., "Present", ... ---
function parseAttendanceSummaryCSV(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l)
  if (!lines.length) return []

  let headerIdx = lines.findIndex(l => l.split(',')[0].replace(/"/g, '').trim().toLowerCase() === 'learners')
  if (headerIdx === -1) {
    console.warn('[WARN] Could not find header row with "Learners" column')
    return []
  }

  const headers = lines[headerIdx].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
  const emailIdx   = headers.findIndex(h => h === 'email')
  const presentIdx = headers.findIndex(h => h === 'present')

  if (emailIdx === -1 || presentIdx === -1) {
    console.warn('[WARN] Missing Email or Present column. Headers:', headers.join(', '))
    return []
  }

  const records = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim())
    const email = cols[emailIdx]
    const present = parseInt(cols[presentIdx]) || 0
    if (!email || !email.includes('@')) continue
    records.push({ email: email.toLowerCase(), present_count: present })
  }
  return records
}

async function main() {
  const now = Math.floor(Date.now() / 1000)
  const startTs = parseInt(process.argv[2] || String(now - 14 * 86400))
  const endTs   = parseInt(process.argv[3] || String(now))

  const startDate = new Date(startTs * 1000).toISOString().split('T')[0]
  const endDate   = new Date(endTs * 1000).toISOString().split('T')[0]
  console.log(`[*] Syncing attendance ${startDate} --> ${endDate}`)

  // 1. Fetch attendance CSV from Edmingle
  const csvUrl = `${BASE_URL}/report/csv?apikey=${API_KEY}&ORGID=${ORG_ID}&report_type=20&start=${startTs}&end=${endTs}&class_id=${CLASS_ID}`
  console.log('[*] Calling Edmingle report/csv...')
  const csvRes = await fetch(csvUrl, { headers: { apikey: API_KEY, ORGID: ORG_ID } })
  if (!csvRes.ok) {
    console.error('[ERROR] Edmingle API returned', csvRes.status, await csvRes.text())
    process.exit(1)
  }
  const csvText = await csvRes.text()
  const rawRecords = parseAttendanceSummaryCSV(csvText)
  console.log(`[OK] Edmingle returned ${rawRecords.length} student summary rows`)

  if (!rawRecords.length) {
    console.log('[OK] Nothing to sync.')
    return
  }

  // 2. Load leaderboard students
  const { data: students, error: sErr } = await db.from('students').select('id, email, edmingle_id').eq('cohort', 'C7')
  if (sErr) { console.error('[ERROR]', sErr.message); process.exit(1) }

  const emailToStudent = new Map(students.map(s => [s.email.toLowerCase(), s]))

  // 3. If any students missing edmingle_id, try to populate via student roster API (for future use)
  const needsMapping = students.filter(s => !s.edmingle_id)
  if (needsMapping.length > 0) {
    console.log(`[*] Fetching Edmingle student roster to map ${needsMapping.length} IDs...`)
    const edStudents = await fetchEdmingleStudents()
    if (edStudents.length) {
      const updates = []
      for (const es of edStudents) {
        const email = (es.email || es.student_email || '').toLowerCase()
        const eid = String(es.student_Id || es.studentId || es.id || '')
        const matched = emailToStudent.get(email)
        if (matched && !matched.edmingle_id && eid) {
          updates.push({ id: matched.id, edmingle_id: eid })
        }
      }
      if (updates.length) {
        for (const u of updates) {
          await db.from('students').update({ edmingle_id: u.edmingle_id }).eq('id', u.id)
        }
        console.log(`[OK] Mapped ${updates.length} edmingle IDs`)
      }
    }
  }

  // 4. Upsert student_points directly from summary (present_count * 20 = attendance_pts)
  let upserted = 0
  let unmatched = 0

  for (const rec of rawRecords) {
    const student = emailToStudent.get(rec.email)
    if (!student) { unmatched++; continue }
    const pts = rec.present_count * 20
    const { error } = await db
      .from('student_points')
      .upsert(
        { student_id: student.id, attendance_pts: pts, last_synced_at: new Date().toISOString() },
        { onConflict: 'student_id' }
      )
    if (error) console.warn('[WARN]', error.message)
    else upserted++
  }

  console.log(`[OK] Upserted ${upserted} attendance records (${unmatched} unmatched)`)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
