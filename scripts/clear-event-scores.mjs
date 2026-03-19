/**
 * clear-event-scores.mjs
 * Wipe all uploaded scores for a given event_type from DB.
 * Recalculates student_points for affected students.
 *
 * Usage:
 *   node scripts/clear-event-scores.mjs <event_type>
 *
 * Examples:
 *   node scripts/clear-event-scores.mjs assignment_1
 *   node scripts/clear-event-scores.mjs hackathon_1
 */

import { db } from './db.mjs'

const VALID_EVENT_TYPES = [
  'assignment_1', 'assignment_2', 'assignment_3', 'assignment_4',
  'midcapstone', 'hackathon_1', 'final_capstone',
]

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

    const rows = uploads || []
    const assignmentPts = rows
      .filter(u => u.event_type.startsWith('assignment_'))
      .reduce((s, u) => s + u.points, 0)
    const hackathonPts = rows
      .filter(u => u.event_type === 'hackathon_1')
      .reduce((s, u) => s + u.points, 0)
    const capstonePts = rows
      .filter(u => ['midcapstone', 'final_capstone'].includes(u.event_type))
      .reduce((s, u) => s + u.points, 0)

    const { error: updateErr } = await db
      .from('student_points')
      .update({ assignment_pts: assignmentPts, hackathon_pts: hackathonPts, capstone_pts: capstonePts, updated_at: new Date().toISOString() })
      .eq('student_id', studentId)

    if (updateErr) {
      console.error(`[ERROR] Failed to update student_points for ${studentId}: ${updateErr.message}`)
    }
  }
}

async function main() {
  const [eventType] = process.argv.slice(2)

  if (!eventType) {
    console.error('[ERROR] Usage: node scripts/clear-event-scores.mjs <event_type>')
    console.error('[ERROR] Valid event types:', VALID_EVENT_TYPES.join(', '))
    process.exit(1)
  }

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    console.error(`[ERROR] Invalid event_type: ${eventType}`)
    console.error('[ERROR] Valid:', VALID_EVENT_TYPES.join(', '))
    process.exit(1)
  }

  console.log(`[*] Clearing scores for event_type=${eventType}`)

  // Fetch affected student IDs before deleting
  const { data: affected, error: fetchErr } = await db
    .from('score_uploads')
    .select('student_id')
    .eq('event_type', eventType)

  if (fetchErr) {
    console.error('[ERROR] Failed to fetch affected students:', fetchErr.message)
    process.exit(1)
  }

  const affectedIds = [...new Set((affected || []).map(r => r.student_id))]
  console.log(`[*] Found ${affectedIds.length} affected students`)

  // Delete from score_uploads
  const { error: deleteErr } = await db
    .from('score_uploads')
    .delete()
    .eq('event_type', eventType)

  if (deleteErr) {
    console.error('[ERROR] Failed to delete score_uploads:', deleteErr.message)
    process.exit(1)
  }
  console.log(`[OK] Deleted score_uploads rows for ${eventType}`)

  // Delete from score_upload_batches
  const { error: batchErr } = await db
    .from('score_upload_batches')
    .delete()
    .eq('event_type', eventType)

  if (batchErr) {
    console.error('[ERROR] Failed to delete score_upload_batches:', batchErr.message)
    process.exit(1)
  }
  console.log(`[OK] Deleted score_upload_batches rows for ${eventType}`)

  // Recalculate student_points for affected students
  if (affectedIds.length > 0) {
    await recalcStudentPoints(affectedIds)
    console.log(`[OK] Recalculated student_points for ${affectedIds.length} students`)
  }

  console.log('[OK] Done.')
}

main().catch(err => { console.error('[ERROR]', err); process.exit(1) })
