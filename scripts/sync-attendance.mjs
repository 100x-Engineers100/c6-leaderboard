/**
 * sync-attendance.mjs
 * Fetch Edmingle attendance CSV for C7, upsert records, recalculate points.
 *
 * Run:
 *   node scripts/sync-attendance.mjs                    # last 14 days
 *   node scripts/sync-attendance.mjs START_TS END_TS    # unix timestamps
 */
import { db } from './db.mjs'

const BASE_URL = process.env.EDMINGLE_BASE_URL?.replace(/\/$/, '')
const API_KEY  = process.env.EDMINGLE_API_KEY
const ORG_ID   = process.env.EDMINGLE_ORG_ID
const BATCH_ID = process.env.C7_BATCH_ID || '194294'

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
  // Response shape varies — handle both array and nested data
  const list = Array.isArray(json) ? json : (json.data ?? json.students ?? [])
  return list // each item expected to have email + student_Id (or id)
}

// --- Parse Edmingle CSV attendance report ---
// Columns vary but typically: Student Name, Student ID, Email, Session Name, Session Date, Status
function parseAttendanceCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim())
  if (!lines.length) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  const records = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))
    const row = {}
    headers.forEach((h, idx) => { row[h] = cols[idx] || '' })
    records.push(row)
  }
  return records
}

// --- Determine session date from record ---
function parseSessionDate(raw) {
  if (!raw) return null
  // Try common formats: YYYY-MM-DD, DD-MM-YYYY, MM/DD/YYYY
  const d = new Date(raw)
  if (!isNaN(d)) return d.toISOString().split('T')[0]
  return null
}

async function main() {
  const now = Math.floor(Date.now() / 1000)
  const startTs = parseInt(process.argv[2] || String(now - 14 * 86400))
  const endTs   = parseInt(process.argv[3] || String(now))

  const startDate = new Date(startTs * 1000).toISOString().split('T')[0]
  const endDate   = new Date(endTs * 1000).toISOString().split('T')[0]
  console.log(`[*] Syncing attendance ${startDate} --> ${endDate}`)

  // 1. Fetch attendance CSV from Edmingle
  const csvUrl = `${BASE_URL}/report/csv?apikey=${API_KEY}&response_type=1&ORGID=${ORG_ID}&report_type=55&organization_id=${ORG_ID}&start_time=${startTs}&end_time=${endTs}&batch_id=${BATCH_ID}`
  console.log('[*] Calling Edmingle report/csv...')
  const csvRes = await fetch(csvUrl, { headers: { apikey: API_KEY, ORGID: ORG_ID } })
  if (!csvRes.ok) {
    console.error('[ERROR] Edmingle API returned', csvRes.status, await csvRes.text())
    process.exit(1)
  }
  const csvText = await csvRes.text()
  const rawRecords = parseAttendanceCSV(csvText)
  console.log(`[OK] Edmingle returned ${rawRecords.length} attendance rows`)

  if (!rawRecords.length) {
    console.log('[OK] Nothing to sync.')
    return
  }

  // 2. Load leaderboard students
  const { data: students, error: sErr } = await db.from('students').select('id, email, edmingle_id').eq('cohort', 'C7')
  if (sErr) { console.error('[ERROR]', sErr.message); process.exit(1) }

  const emailToStudent = new Map(students.map(s => [s.email.toLowerCase(), s]))
  const edmingleIdToStudent = new Map(students.filter(s => s.edmingle_id).map(s => [s.edmingle_id, s]))

  // 3. If any students missing edmingle_id, try to populate via student roster API
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
          edmingleIdToStudent.set(eid, matched)
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

  // 4. Upsert attendance_records
  let upserted = 0
  let unmatched = 0
  const toUpsert = []

  for (const rec of rawRecords) {
    // Try matching by edmingle student id first, then email
    const eid = rec['student id'] || rec['studentid'] || rec['student_id'] || ''
    const email = (rec['email'] || rec['student email'] || '').toLowerCase()
    const sessionDate = parseSessionDate(rec['session date'] || rec['date'] || rec['session_date'])
    const sessionName = rec['session name'] || rec['session'] || rec['title'] || ''
    const status = (rec['status'] || rec['attendance'] || '').toLowerCase()
    const isPresent = status.includes('present') || status === 'yes' || status === '1' || status === 'true'

    if (!sessionDate) continue

    let student = edmingleIdToStudent.get(eid) || emailToStudent.get(email)
    if (!student) { unmatched++; continue }

    toUpsert.push({
      student_id: student.id,
      edmingle_student_id: eid || null,
      session_date: sessionDate,
      session_name: sessionName,
      is_present: isPresent,
    })
  }

  const BATCH = 200
  for (let i = 0; i < toUpsert.length; i += BATCH) {
    const { error } = await db
      .from('attendance_records')
      .upsert(toUpsert.slice(i, i + BATCH), { onConflict: 'student_id,session_date' })
    if (error) console.warn('[WARN] attendance upsert:', error.message)
    else upserted += Math.min(BATCH, toUpsert.length - i)
  }
  console.log(`[OK] Upserted ${upserted} attendance records (${unmatched} unmatched)`)

  // 5. Recalculate attendance_pts for all C7 students
  console.log('[*] Recalculating attendance points...')
  const { data: counts, error: cErr } = await db
    .from('attendance_records')
    .select('student_id, is_present')
  if (cErr) { console.error('[ERROR]', cErr.message); process.exit(1) }

  const ptsByStudent = new Map()
  for (const r of counts) {
    if (r.is_present) {
      ptsByStudent.set(r.student_id, (ptsByStudent.get(r.student_id) || 0) + 20)
    }
  }

  for (const [studentId, pts] of ptsByStudent) {
    const { error } = await db
      .from('student_points')
      .upsert(
        { student_id: studentId, attendance_pts: pts, last_synced_at: new Date().toISOString() },
        { onConflict: 'student_id' }
      )
    if (error) console.warn('[WARN]', error.message)
  }

  console.log(`[OK] Updated attendance_pts for ${ptsByStudent.size} students`)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
