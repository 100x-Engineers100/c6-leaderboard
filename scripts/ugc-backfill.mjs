/**
 * ugc-backfill.mjs
 * Backfill missing UGC posts per the ugc-backfill-runbook.md.
 * Inserts placeholder Post rows in UGC DB + ugc_posts_cache in leaderboard DB,
 * then recalculates ugc_post_pts.
 *
 * Edit BACKFILL_TARGETS below with correct post counts, then run:
 *   node scripts/ugc-backfill.mjs [--dry-run]
 */
import { randomUUID } from 'crypto'
import { db } from './db.mjs'
import { ugcDb } from './ugc-db.mjs'

// --- CONFIGURE THIS ---
const BACKFILL_TARGETS = [
  { email: 'shraddhab196@gmail.com', correctCount: 49 },
]
// ----------------------

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) console.log('[DRY-RUN] No writes will happen\n')

async function main() {
  const emails = BACKFILL_TARGETS.map(t => t.email)

  // Fetch UGC users
  const { data: ugcUsers, error: e1 } = await ugcDb
    .from('User')
    .select('id, email, name, linkedinUsername')
    .in('email', emails)
  if (e1) { console.error('[ERROR] UGC fetch:', e1.message); process.exit(1) }

  const ugcMap = new Map(ugcUsers.map(u => [u.email.toLowerCase(), u]))

  // Fetch current post counts per user
  const ugcIds = ugcUsers.map(u => u.id)
  const { data: posts, error: e2 } = await ugcDb
    .from('Post')
    .select('userId')
    .in('userId', ugcIds)
  if (e2) { console.error('[ERROR] Posts fetch:', e2.message); process.exit(1) }

  const currentCountMap = new Map()
  for (const p of posts) currentCountMap.set(p.userId, (currentCountMap.get(p.userId) || 0) + 1)

  // Fetch leaderboard student IDs
  const { data: lbStudents, error: e3 } = await db
    .from('students')
    .select('id, email')
    .in('email', emails)
  if (e3) { console.error('[ERROR] LB fetch:', e3.message); process.exit(1) }

  const lbMap = new Map(lbStudents.map(s => [s.email.toLowerCase(), s]))

  console.log('\n=== BACKFILL PLAN ===')
  const ugcInserts = []
  const cacheInserts = []
  const pointUpdates = []

  for (const target of BACKFILL_TARGETS) {
    const ugcUser = ugcMap.get(target.email)
    const lbStudent = lbMap.get(target.email)

    if (!ugcUser) { console.log(`[SKIP] ${target.email} — not in UGC DB`); continue }
    if (!lbStudent) { console.log(`[SKIP] ${target.email} — not in leaderboard DB`); continue }

    const current = currentCountMap.get(ugcUser.id) || 0
    const missing = target.correctCount - current

    console.log(`  ${ugcUser.name} <${target.email}>`)
    console.log(`    UGC posts now: ${current} | correct: ${target.correctCount} | inserting: ${missing}`)
    console.log(`    linkedinUsername: ${ugcUser.linkedinUsername}`)
    console.log(`    ugc_post_pts will be: ${target.correctCount * 20}`)

    if (missing <= 0) { console.log(`    [SKIP] already at or above correct count`); continue }

    const slug = ugcUser.linkedinUsername || ugcUser.email.split('@')[0]
    const now = new Date().toISOString()

    for (let n = 1; n <= missing; n++) {
      const url = `placeholder://backfill/${slug}/${current + n}`
      ugcInserts.push({
        id: randomUUID(),
        userId: ugcUser.id,
        url,
        platform: 'LINKEDIN',
        createdAt: now,
        numLikes: 0,
        numComments: 0,
        postedAt: now,
        hasReacted: false,
      })
      cacheInserts.push({
        student_id: lbStudent.id,
        post_url: url,
        num_likes: 0,
        num_comments: 0,
        posted_at: now,
        platform: 'LINKEDIN',
      })
    }

    pointUpdates.push({ student_id: lbStudent.id, ugc_post_pts: target.correctCount * 20 })
  }

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] Would insert ${ugcInserts.length} UGC posts, ${cacheInserts.length} cache rows, update ${pointUpdates.length} point rows`)
    return
  }

  // Step 1: Insert into UGC DB Post table
  if (ugcInserts.length) {
    const { error } = await ugcDb.from('Post').insert(ugcInserts)
    if (error) { console.error('[ERROR] UGC Post insert:', error.message); process.exit(1) }
    console.log(`\n[OK] Inserted ${ugcInserts.length} placeholder posts in UGC DB`)
  }

  // Step 2: Insert into leaderboard ugc_posts_cache
  if (cacheInserts.length) {
    const { error } = await db.from('ugc_posts_cache').upsert(cacheInserts, { onConflict: 'post_url' })
    if (error) { console.error('[ERROR] Cache insert:', error.message); process.exit(1) }
    console.log(`[OK] Inserted ${cacheInserts.length} rows into ugc_posts_cache`)
  }

  // Step 3: Update ugc_post_pts (never decrease)
  for (const u of pointUpdates) {
    const { data: existing } = await db.from('student_points').select('ugc_post_pts').eq('student_id', u.student_id).single()
    const finalPts = Math.max(u.ugc_post_pts, existing?.ugc_post_pts || 0)
    const { error } = await db.from('student_points').update({ ugc_post_pts: finalPts, last_synced_at: new Date().toISOString() }).eq('student_id', u.student_id)
    if (error) console.warn(`[WARN] points update failed:`, error.message)
    else console.log(`[OK] ${u.student_id} ugc_post_pts → ${finalPts}`)
  }

  console.log('\n[OK] Backfill complete. Run node scripts/sync-ugc.mjs to verify.')
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
