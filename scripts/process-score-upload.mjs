/**
 * process-score-upload.mjs
 * CLI: upload a scored CSV for one event type and upsert into DB.
 *
 * Usage:
 *   node scripts/process-score-upload.mjs <event_type> <csv_path> [--preview]
 *
 * event_type: assignment_1 | assignment_2 | assignment_3 | assignment_4
 *             midcapstone | hackathon_1 | final_capstone
 *
 * Examples:
 *   node scripts/process-score-upload.mjs assignment_1 "docs/Assignment_C5_m1.csv"
 *   node scripts/process-score-upload.mjs midcapstone "docs/midcapstone_C6.csv" --preview
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { db } from './db.mjs'

const VALID_EVENT_TYPES = [
  'assignment_1', 'assignment_2', 'assignment_3', 'assignment_4',
  'midcapstone', 'hackathon_1', 'final_capstone',
]

// --- CSV parser (RFC 4180: handles quoted fields, embedded newlines, CRLF) ---
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

// --- Point calculation per event type ---
// Returns Map<email, { points, rawScore }>
function calculatePoints(eventType, rows) {
  const result = new Map()

  if (eventType.startsWith('assignment_')) {
    // rows[0]="Submissions Export", rows[1]=headers, rows[2+]=data
    // col[2]=Email, col[5]=EvaluationStatus, col[8]=MarksObtained
    // Per email: take max marks among EVALUATED rows only (case-insensitive)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i]
      const email = row[2]?.toLowerCase().trim()
      const status = row[5]?.trim()
      const marks = parseInt(row[8]) || 0
      if (!email || !email.includes('@')) continue
      if (status?.toLowerCase() !== 'evaluated') continue
      const existing = result.get(email)
      if (!existing || marks > existing.rawScore) {
        result.set(email, { points: marks, rawScore: marks })
      }
    }

  } else if (eventType === 'midcapstone') {
    // Same Edmingle format: rows[0]="Submissions Export", rows[1]=headers, rows[2+]=data
    // col[2]=Email, col[5]=EvaluationStatus, col[8]=MarksObtained
    // Base 30 for anyone in sheet + max marks if EVALUATED (case-insensitive)
    const emailMaxMarks = new Map() // email -> max evaluated marks (-1 = not yet evaluated)
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i]
      const email = row[2]?.toLowerCase().trim()
      const status = row[5]?.trim()
      const marks = parseInt(row[8]) || 0
      if (!email || !email.includes('@')) continue
      if (!emailMaxMarks.has(email)) emailMaxMarks.set(email, -1)
      if (status?.toLowerCase() === 'evaluated') {
        const cur = emailMaxMarks.get(email)
        if (marks > cur) emailMaxMarks.set(email, marks)
      }
    }
    for (const [email, maxMarks] of emailMaxMarks) {
      const rawScore = maxMarks >= 0 ? maxMarks : 0
      result.set(email, { points: 30 + rawScore, rawScore })
    }

  } else if (eventType === 'hackathon_1') {
    // Tally form evaluation CSV — scan header row for Email and Total Points cols
    const header = rows[0] || []
    let emailCol = -1
    let totalCol = -1
    for (let j = 0; j < header.length; j++) {
      const h = header[j].toLowerCase()
      if (h === 'email') emailCol = j
      else if (h.includes('total') && h.includes('points')) totalCol = j
    }
    if (emailCol === -1) throw new Error("[ERROR] Could not find 'Email' column in hackathon CSV. Check header row.")
    if (totalCol === -1) throw new Error("[ERROR] Could not find 'Total Points' column in hackathon CSV. Check header row.")
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const email = row[emailCol]?.toLowerCase().trim()
      const total = parseInt(row[totalCol]) || 0
      if (!email || !email.includes('@')) continue
      const existing = result.get(email)
      if (!existing || total > existing.rawScore) {
        result.set(email, { points: total, rawScore: total })
      }
    }

  } else if (eventType === 'final_capstone') {
    // Simple email list format — scan all rows for Email column header
    // Award 200 pts to every valid email found after the header row
    let emailCol = -1
    let headerRowIdx = -1
    for (let i = 0; i < rows.length && emailCol === -1; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        if (/^(email|mail)$/i.test(rows[i][j])) {
          emailCol = j
          headerRowIdx = i
          break
        }
      }
    }
    if (emailCol === -1) throw new Error("[ERROR] Could not find 'Email' column in final_capstone CSV. Check header row.")
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const email = rows[i][emailCol]?.toLowerCase().trim()
      if (!email || !email.includes('@')) continue
      result.set(email, { points: 200, rawScore: 200 })
    }
  }

  return result
}

// --- Recalculate student_points from score_uploads for a set of student IDs ---
async function recalcStudentPoints(studentIds) {
  for (const studentId of studentIds) {
    const { data: uploads, error } = await db
      .from('score_uploads')
      .select('event_type, points')
      .eq('student_id', studentId)

    if (error) {
      console.error(`[ERROR] Failed to fetch uploads for ${studentId}: ${error.message}`)
      continue
    }

    const assignmentPts = (uploads || [])
      .filter(u => u.event_type.startsWith('assignment_'))
      .reduce((sum, u) => sum + u.points, 0)

    const hackathonPts = (uploads || [])
      .filter(u => u.event_type === 'hackathon_1')
      .reduce((sum, u) => sum + u.points, 0)

    const capstonePts = (uploads || [])
      .filter(u => ['midcapstone', 'final_capstone'].includes(u.event_type))
      .reduce((sum, u) => sum + u.points, 0)

    const { error: updateErr } = await db
      .from('student_points')
      .update({ assignment_pts: assignmentPts, hackathon_pts: hackathonPts, capstone_pts: capstonePts, updated_at: new Date().toISOString() })
      .eq('student_id', studentId)

    if (updateErr) {
      console.error(`[ERROR] Failed to update student_points for ${studentId}: ${updateErr.message}`)
    }
  }
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2)
  const previewFlag = args.includes('--preview')
  const positional = args.filter(a => !a.startsWith('--'))

  if (positional.length < 2) {
    console.error('[ERROR] Usage: node scripts/process-score-upload.mjs <event_type> <csv_path> [--preview]')
    console.error('[ERROR] Valid event types:', VALID_EVENT_TYPES.join(', '))
    process.exit(1)
  }

  const [eventType, csvPath] = positional

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    console.error(`[ERROR] Invalid event_type: ${eventType}`)
    console.error('[ERROR] Valid:', VALID_EVENT_TYPES.join(', '))
    process.exit(1)
  }

  const fullPath = resolve(process.cwd(), csvPath)
  let csvText
  try {
    csvText = readFileSync(fullPath, 'utf8')
  } catch (e) {
    console.error(`[ERROR] Cannot read file: ${fullPath}`)
    process.exit(1)
  }

  console.log(`[*] Processing event_type=${eventType} file=${fullPath}`)

  const rows = parseCSV(csvText)
  console.log(`[*] Parsed ${rows.length} CSV rows`)

  const pointsMap = calculatePoints(eventType, rows)
  console.log(`[*] Found ${pointsMap.size} unique emails with points`)

  // Fetch all students emails -> id mapping
  const { data: students, error: studentsErr } = await db
    .from('students')
    .select('id, email')

  if (studentsErr) {
    console.error('[ERROR] Failed to fetch students:', studentsErr.message)
    process.exit(1)
  }

  const emailToId = new Map(students.map(s => [s.email.toLowerCase(), s.id]))

  const matched = []
  const unmatched = []

  for (const [email, { points, rawScore }] of pointsMap) {
    const studentId = emailToId.get(email)
    if (studentId) {
      matched.push({ studentId, email, points, rawScore })
    } else {
      unmatched.push(email)
    }
  }

  console.log(`[*] Matched: ${matched.length} | Unmatched: ${unmatched.length}`)
  if (unmatched.length > 0) {
    console.log('[WARN] Unmatched emails:', unmatched.slice(0, 10).join(', '), unmatched.length > 10 ? `... +${unmatched.length - 10} more` : '')
  }

  // Preview mode: print table and exit
  if (previewFlag) {
    console.log('\n[PREVIEW] -- No DB writes --')
    console.log('Email                              | Points | Raw')
    console.log('-'.repeat(55))
    for (const { email, points, rawScore } of matched.slice(0, 20)) {
      console.log(`${email.padEnd(35)} | ${String(points).padStart(6)} | ${rawScore}`)
    }
    if (matched.length > 20) console.log(`... and ${matched.length - 20} more`)
    return
  }

  // Upsert to score_uploads
  const upsertPayload = matched.map(({ studentId, points, rawScore }) => ({
    student_id: studentId,
    event_type: eventType,
    points,
    raw_score: rawScore,
    updated_at: new Date().toISOString(),
  }))

  const { error: upsertErr } = await db
    .from('score_uploads')
    .upsert(upsertPayload, { onConflict: 'student_id,event_type' })

  if (upsertErr) {
    console.error('[ERROR] Upsert failed:', upsertErr.message)
    process.exit(1)
  }

  console.log(`[OK] Upserted ${matched.length} rows to score_uploads`)

  // Log batch
  await db.from('score_upload_batches').insert({
    event_type: eventType,
    row_count: pointsMap.size,
    upserted: matched.length,
    unmatched: unmatched.length,
  })

  // Recalculate student_points
  const affectedIds = matched.map(m => m.studentId)
  await recalcStudentPoints(affectedIds)
  console.log(`[OK] Recalculated student_points for ${affectedIds.length} students`)
  console.log('[OK] Done.')
}

main().catch(err => { console.error('[ERROR]', err); process.exit(1) })
