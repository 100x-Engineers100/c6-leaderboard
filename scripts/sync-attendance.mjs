/**
 * sync-attendance.mjs
 * Fetches Edmingle attendance for a given week, filters to Fri/Sat sessions only,
 * and incrementally accumulates pts into student_points (never overwrites history).
 *
 * Usage:
 *   node scripts/sync-attendance.mjs                     # last completed week (default)
 *   node scripts/sync-attendance.mjs --week 2026-03-08   # specific week (pass the Sunday)
 *   node scripts/sync-attendance.mjs --backfill          # all weeks from C7 start to now
 */
import { db } from './db.mjs'

const BASE_URL = process.env.EDMINGLE_BASE_URL?.replace(/\/$/, '')
const API_KEY  = process.env.EDMINGLE_API_KEY
const ORG_ID   = process.env.EDMINGLE_ORG_ID
const CLASS_ID = process.env.C7_CLASS_ID || '446933'

// C7 started Friday 13 Mar 2026 — first Sunday before that is 8 Mar
const C7_FIRST_SUNDAY = new Date('2026-03-08T00:00:00Z')

if (!BASE_URL || !API_KEY || !ORG_ID) {
  throw new Error('[ERROR] EDMINGLE_BASE_URL, EDMINGLE_API_KEY, EDMINGLE_ORG_ID must be set')
}

// Returns the Sunday (UTC midnight) of the week containing `date`
function getWeekSunday(date) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// Returns the Sunday that started the last *completed* week (ended last Saturday)
function getLastWeekSunday() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const thisWeekSunday = getWeekSunday(today)
  return new Date(thisWeekSunday.getTime() - 7 * 24 * 60 * 60 * 1000)
}

// Parse "13 Mar" style column headers into a UTC Date
function parseSessionDate(header) {
  const clean = header.trim().replace(/"/g, '')
  const match = clean.match(/^(\d{1,2})\s+([A-Za-z]{3})$/)
  if (!match) return null
  const day = parseInt(match[1])
  const monthMap = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 }
  const month = monthMap[match[2].toLowerCase()]
  if (month === undefined) return null
  // Cohort runs 2026-2027; if month < Mar assume next year
  const year = month >= 2 ? 2026 : 2027
  return new Date(Date.UTC(year, month, day))
}

function isFriOrSat(date) {
  const day = date.getUTCDay()
  return day === 5 || day === 6 // 5=Fri, 6=Sat
}

// Parse CSV, return per-student weekend (Fri/Sat) present counts only
function parseWeekendAttendance(csvText) {
  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l)

  const headerIdx = lines.findIndex(l =>
    l.split(',')[0].replace(/"/g, '').trim().toLowerCase() === 'learners'
  )
  if (headerIdx === -1) {
    console.warn('[WARN] Could not find Learners header row in CSV')
    return { records: [], weekendDates: [] }
  }

  const rawHeaders = lines[headerIdx].split(',').map(h => h.replace(/"/g, '').trim())

  // Find indices of columns that are Friday or Saturday
  const weekendColIndices = []
  const weekendDates = []
  for (let i = 0; i < rawHeaders.length; i++) {
    const date = parseSessionDate(rawHeaders[i])
    if (date && isFriOrSat(date)) {
      weekendColIndices.push(i)
      weekendDates.push(date)
    }
  }

  const emailIdx = rawHeaders.findIndex(h => h.toLowerCase() === 'email')
  if (emailIdx === -1) {
    console.warn('[WARN] No Email column found')
    return { records: [], weekendDates }
  }

  const records = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim())
    const email = cols[emailIdx]
    if (!email || !email.includes('@')) continue

    let weekendPresent = 0
    for (const idx of weekendColIndices) {
      if ((cols[idx] || '').toUpperCase() === 'P') weekendPresent++
    }

    records.push({ email: email.toLowerCase(), weekend_present: weekendPresent })
  }

  return { records, weekendDates }
}

async function syncWeek(weekSunday) {
  const weekStart = new Date(weekSunday)
  weekStart.setUTCHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  const startTs  = Math.floor(weekStart.getTime() / 1000)
  const endTs    = Math.floor(weekEnd.getTime() / 1000)
  const weekLabel = weekStart.toISOString().split('T')[0] // YYYY-MM-DD (the Sunday)

  console.log(`\n[*] Week ${weekLabel} | ${weekStart.toUTCString()} --> ${weekEnd.toUTCString()}`)

  // Fetch CSV from Edmingle scoped to this week
  const csvUrl = `${BASE_URL}/report/csv?apikey=${API_KEY}&ORGID=${ORG_ID}&report_type=20&start=${startTs}&end=${endTs}&class_id=${CLASS_ID}`
  const csvRes = await fetch(csvUrl, { headers: { apikey: API_KEY, ORGID: ORG_ID } })
  if (!csvRes.ok) {
    console.error('[ERROR] Edmingle API returned', csvRes.status, await csvRes.text())
    return
  }
  const csvText = await csvRes.text()
  const { records, weekendDates } = parseWeekendAttendance(csvText)

  if (!weekendDates.length) {
    console.log('[OK] No Fri/Sat sessions in this week — skipping')
    return
  }

  const sessionLabels = weekendDates.map(d => d.toISOString().split('T')[0]).join(', ')
  console.log(`[*] Weekend sessions: ${sessionLabels}`)
  console.log(`[*] Students in CSV: ${records.length}`)

  if (!records.length) return

  // Load C7 students
  const { data: students, error: sErr } = await db.from('students').select('id, email').eq('cohort', 'C7')
  if (sErr) { console.error('[ERROR] DB:', sErr.message); return }
  const emailToStudent = new Map(students.map(s => [s.email.toLowerCase(), s]))

  let upserted = 0, unmatched = 0

  for (const rec of records) {
    const student = emailToStudent.get(rec.email)
    if (!student) { unmatched++; continue }

    const pts = rec.weekend_present * 20

    // Upsert weekly log (idempotent — re-running same week is safe since attendance is final)
    const { error: logErr } = await db
      .from('weekly_attendance_log')
      .upsert(
        {
          student_id:       student.id,
          week_start:       weekLabel,
          weekend_sessions: rec.weekend_present,
          pts_awarded:      pts,
          synced_at:        new Date().toISOString()
        },
        { onConflict: 'student_id,week_start' }
      )
    if (logErr) { console.warn('[WARN] log upsert:', logErr.message); continue }

    // Recalculate total from all weekly logs — single source of truth
    const { data: allWeeks, error: totErr } = await db
      .from('weekly_attendance_log')
      .select('pts_awarded')
      .eq('student_id', student.id)
    if (totErr) { console.warn('[WARN] total fetch:', totErr.message); continue }

    const totalPts = allWeeks.reduce((sum, row) => sum + (row.pts_awarded || 0), 0)

    const { error: ptErr } = await db
      .from('student_points')
      .upsert(
        { student_id: student.id, attendance_pts: totalPts, last_synced_at: new Date().toISOString() },
        { onConflict: 'student_id' }
      )
    if (ptErr) console.warn('[WARN] points upsert:', ptErr.message)
    else upserted++
  }

  console.log(`[OK] Week ${weekLabel}: upserted=${upserted} unmatched=${unmatched}`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--backfill')) {
    // Process every week from C7 start through last completed week
    console.log('[*] Backfill mode: processing all weeks from C7 start')
    const lastWeekSunday = getLastWeekSunday()
    let current = new Date(C7_FIRST_SUNDAY)
    while (current <= lastWeekSunday) {
      await syncWeek(current)
      current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
    console.log('\n[OK] Backfill complete')
    return
  }

  const weekFlagIdx = args.findIndex(a => a === '--week')
  if (weekFlagIdx !== -1) {
    const dateStr = args[weekFlagIdx + 1]
    if (!dateStr) { console.error('[ERROR] --week requires a date arg: YYYY-MM-DD'); process.exit(1) }
    const sunday = new Date(`${dateStr}T00:00:00Z`)
    if (isNaN(sunday.getTime())) { console.error('[ERROR] Invalid date:', dateStr); process.exit(1) }
    await syncWeek(sunday)
    return
  }

  // Default: last completed week
  const lastSunday = getLastWeekSunday()
  console.log(`[*] Default: syncing last completed week (${lastSunday.toISOString().split('T')[0]})`)
  await syncWeek(lastSunday)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
