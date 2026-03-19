import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isValidEventType, type EventType } from '@/lib/event-config'

// --- CSV parser (RFC 4180: handles quoted fields with embedded newlines/commas) ---
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
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

type PointEntry = { points: number; rawScore: number }

// --- Point calculation per event type ---
function calculatePoints(eventType: EventType, rows: string[][]): Map<string, PointEntry> {
  const result = new Map<string, PointEntry>()

  if (eventType.startsWith('assignment_')) {
    // rows[0]="Submissions Export", rows[1]=headers, rows[2+]=data
    // col[2]=Email, col[5]=EvaluationStatus, col[8]=MarksObtained (case-insensitive)
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
    // rows[0]="Submissions Export", rows[1]=headers, rows[2+]=data
    // col[2]=Email, col[5]=EvaluationStatus, col[8]=MarksObtained
    // Base 30 for anyone in sheet + max marks if EVALUATED (case-insensitive)
    const emailMaxMarks = new Map<string, number>() // -1 = not yet evaluated
    for (let i = 2; i < rows.length; i++) {
      const row = rows[i]
      const email = row[2]?.toLowerCase().trim()
      const status = row[5]?.trim()
      const marks = parseInt(row[8]) || 0
      if (!email || !email.includes('@')) continue
      if (!emailMaxMarks.has(email)) emailMaxMarks.set(email, -1)
      if (status?.toLowerCase() === 'evaluated') {
        const cur = emailMaxMarks.get(email)!
        if (marks > cur) emailMaxMarks.set(email, marks)
      }
    }
    Array.from(emailMaxMarks.entries()).forEach(([email, maxMarks]) => {
      const rawScore = maxMarks >= 0 ? maxMarks : 0
      result.set(email, { points: 30 + rawScore, rawScore })
    })

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

// --- Recalculate student_points columns from score_uploads ---
async function recalcStudentPoints(studentIds: string[]): Promise<void> {
  const supabase = getSupabase()
  for (const studentId of studentIds) {
    const { data: uploads } = await supabase
      .from('score_uploads')
      .select('event_type, points')
      .eq('student_id', studentId)

    const rows = uploads ?? []
    const assignmentPts = rows
      .filter(u => u.event_type.startsWith('assignment_'))
      .reduce((s, u) => s + u.points, 0)
    const hackathonPts = rows
      .filter(u => u.event_type === 'hackathon_1')
      .reduce((s, u) => s + u.points, 0)
    const capstonePts = rows
      .filter(u => ['midcapstone', 'final_capstone'].includes(u.event_type))
      .reduce((s, u) => s + u.points, 0)

    await supabase
      .from('student_points')
      .update({
        assignment_pts: assignmentPts,
        hackathon_pts: hackathonPts,
        capstone_pts: capstonePts,
        updated_at: new Date().toISOString(),
      })
      .eq('student_id', studentId)
  }
}

// GET /api/admin/upload/[event_type] -- last batch info
export async function GET(
  _req: NextRequest,
  { params }: { params: { event_type: string } }
) {
  const { event_type } = params
  if (!isValidEventType(event_type)) {
    return NextResponse.json({ error: `Invalid event_type: ${event_type}` }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data } = await supabase
    .from('score_upload_batches')
    .select('*')
    .eq('event_type', event_type)
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ lastBatch: data ?? null })
}

// POST /api/admin/upload/[event_type]
// Body: multipart/form-data with "file" (CSV) and optional "preview" ("true"/"false")
export async function POST(
  request: NextRequest,
  { params }: { params: { event_type: string } }
) {
  const { event_type } = params

  if (!isValidEventType(event_type)) {
    return NextResponse.json({ error: `Invalid event_type: ${event_type}` }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  }

  const isPreview = formData.get('preview') === 'true'
  const csvText = await (file as File).text()

  const rows = parseCSV(csvText)
  const pointsMap = calculatePoints(event_type, rows)

  const supabase = getSupabase()
  const { data: students, error: studentsErr } = await supabase
    .from('students')
    .select('id, name, email')

  if (studentsErr) {
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }

  const emailToStudent = new Map(
    (students ?? []).map(s => [s.email.toLowerCase(), s])
  )

  const matched: { email: string; name: string; studentId: string; points: number; rawScore: number }[] = []
  const unmatchedEmails: string[] = []

  Array.from(pointsMap.entries()).forEach(([email, { points, rawScore }]) => {
    const student = emailToStudent.get(email)
    if (student) {
      matched.push({ email, name: student.name, studentId: student.id, points, rawScore })
    } else {
      unmatchedEmails.push(email)
    }
  })

  // Preview: return calculated data without writing to DB
  if (isPreview) {
    return NextResponse.json({
      preview: true,
      event_type,
      students: matched.map(({ email, name, points, rawScore }) => ({ email, name, points, rawScore })),
      total_students: matched.length,
      unmatched_emails: unmatchedEmails,
    })
  }

  // Commit: upsert to score_uploads
  const upsertPayload = matched.map(({ studentId, points, rawScore }) => ({
    student_id: studentId,
    event_type,
    points,
    raw_score: rawScore,
    updated_at: new Date().toISOString(),
  }))

  const { error: upsertErr } = await supabase
    .from('score_uploads')
    .upsert(upsertPayload, { onConflict: 'student_id,event_type' })

  if (upsertErr) {
    return NextResponse.json({ error: `Upsert failed: ${upsertErr.message}` }, { status: 500 })
  }

  // Log batch
  const { data: batch } = await supabase
    .from('score_upload_batches')
    .insert({
      event_type,
      row_count: pointsMap.size,
      upserted: matched.length,
      unmatched: unmatchedEmails.length,
    })
    .select('id')
    .single()

  // Recalculate student_points for affected students
  await recalcStudentPoints(matched.map(m => m.studentId))

  return NextResponse.json({
    upserted: matched.length,
    unmatched: unmatchedEmails.length,
    batch_id: batch?.id ?? null,
  })
}
