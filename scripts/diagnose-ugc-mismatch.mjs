/**
 * diagnose-ugc-mismatch.mjs
 * Compare UGC DB post counts vs leaderboard student_points.
 * Finds students where ugc_post_pts doesn't match actual post count * 20.
 *
 * Run: node scripts/diagnose-ugc-mismatch.mjs
 */
import { db } from './db.mjs'
import { ugcDb } from './ugc-db.mjs'

const C7_COHORT_ID = '4c8458b3-a700-42b2-9cc1-f52b3045e2c3'

function sep(title) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(` ${title}`)
  console.log('='.repeat(70))
}

async function main() {
  // 1. All C7 students with their points
  const { data: students, error: sErr } = await db
    .from('students')
    .select('id, name, email, ugc_user_id')
    .eq('cohort', 'C7')
  if (sErr) { console.error('[ERROR] LB students:', sErr.message); process.exit(1) }

  const { data: pointRows, error: pErr } = await db
    .from('student_points')
    .select('student_id, ugc_post_pts, consistency_bonus_pts, attendance_pts, total_points')
    .in('student_id', students.map(s => s.id))
  if (pErr) { console.error('[ERROR] student_points:', pErr.message); process.exit(1) }

  const pointsMap = new Map(pointRows.map(p => [p.student_id, p]))

  // 2. All UGC C7 users
  const { data: ugcUsers, error: uErr } = await ugcDb
    .from('User')
    .select('id, email')
    .eq('cohortId', C7_COHORT_ID)
  if (uErr) { console.error('[ERROR] UGC users:', uErr.message); process.exit(1) }

  const ugcIds = ugcUsers.map(u => u.id)
  const ugcEmailToId = new Map(ugcUsers.map(u => [u.email.toLowerCase(), u.id]))

  // 3. Fetch ALL posts for C7 users (paginated — may be large)
  let allPosts = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data: page, error: pgErr } = await ugcDb
      .from('Post')
      .select('id, userId, url, platform, postedAt')
      .in('userId', ugcIds)
      .range(from, from + PAGE - 1)
    if (pgErr) { console.error('[ERROR] Posts fetch:', pgErr.message); process.exit(1) }
    allPosts = allPosts.concat(page)
    if (page.length < PAGE) break
    from += PAGE
  }
  console.log(`[OK] ${allPosts.length} total UGC posts for C7`)

  // 4. Fetch streaks
  const { data: streaks, error: stErr } = await ugcDb
    .from('Streak')
    .select('userId, weeklyStreak')
    .in('userId', ugcIds)
  if (stErr) console.warn('[WARN] streaks fetch:', stErr.message)
  const streakMap = new Map((streaks || []).map(s => [s.userId, s.weeklyStreak || 0]))

  // 5. Count posts per UGC user
  const postCountByUgcId = new Map()
  for (const p of allPosts) {
    postCountByUgcId.set(p.userId, (postCountByUgcId.get(p.userId) || 0) + 1)
  }

  // Count placeholder vs real posts per user
  const placeholderCountByUgcId = new Map()
  for (const p of allPosts) {
    if (p.url?.startsWith('placeholder://')) {
      placeholderCountByUgcId.set(p.userId, (placeholderCountByUgcId.get(p.userId) || 0) + 1)
    }
  }

  // 6. Build comparison
  const rows = []
  for (const s of students) {
    const ugcId = s.ugc_user_id || ugcEmailToId.get(s.email.toLowerCase())
    const pts = pointsMap.get(s.id)

    const ugcPostCount   = ugcId ? (postCountByUgcId.get(ugcId)   || 0) : 0
    const placeholders   = ugcId ? (placeholderCountByUgcId.get(ugcId) || 0) : 0
    const realPosts      = ugcPostCount - placeholders
    const expectedPts    = ugcPostCount * 20
    const storedPts      = pts?.ugc_post_pts ?? 0
    const storedStreak   = pts?.consistency_bonus_pts ?? 0
    const ugcStreak      = ugcId ? (streakMap.get(ugcId) || 0) : 0
    const expectedStreakPts = ugcStreak * 10

    const ptsMismatch    = expectedPts !== storedPts
    const streakMismatch = expectedStreakPts !== storedStreak

    rows.push({
      name: s.name,
      email: s.email,
      ugcId,
      ugcPostCount,
      placeholders,
      realPosts,
      expectedPts,
      storedPts,
      ptsDiff: storedPts - expectedPts,
      ugcStreak,
      expectedStreakPts,
      storedStreak,
      streakDiff: storedStreak - expectedStreakPts,
      ptsMismatch,
      streakMismatch,
      noUgcId: !ugcId,
    })
  }

  // 7. Students with MORE pts than their post count warrants (backfill inflated)
  const overCounted = rows.filter(r => r.ptsDiff > 0)
  sep(`OVERCOUNTED — stored ugc_post_pts > UGC post count * 20 (${overCounted.length})`)
  if (overCounted.length === 0) console.log('  none')
  overCounted.sort((a, b) => b.ptsDiff - a.ptsDiff).forEach(r =>
    console.log(`  ${r.name} <${r.email}>`)
    + console.log(`    UGC posts: ${r.ugcPostCount} (${r.placeholders} placeholders, ${r.realPosts} real)  expected: ${r.expectedPts}pts  stored: ${r.storedPts}pts  diff: +${r.ptsDiff}`)
  )

  // 8. Students with LESS pts than they should have (posts not counted)
  const underCounted = rows.filter(r => r.ptsDiff < 0)
  sep(`UNDERCOUNTED — stored ugc_post_pts < UGC post count * 20 (${underCounted.length})`)
  if (underCounted.length === 0) console.log('  none')
  underCounted.sort((a, b) => a.ptsDiff - b.ptsDiff).forEach(r =>
    console.log(`  ${r.name} <${r.email}>`)
    + console.log(`    UGC posts: ${r.ugcPostCount} (${r.placeholders} placeholders, ${r.realPosts} real)  expected: ${r.expectedPts}pts  stored: ${r.storedPts}pts  diff: ${r.ptsDiff}`)
  )

  // 9. Streak mismatches
  const streakMismatches = rows.filter(r => r.streakMismatch)
  sep(`STREAK MISMATCH — consistency_bonus_pts wrong (${streakMismatches.length})`)
  if (streakMismatches.length === 0) console.log('  none')
  streakMismatches.forEach(r =>
    console.log(`  ${r.name}: UGC streak=${r.ugcStreak} (${r.expectedStreakPts}pts expected) stored=${r.storedStreak}pts`)
  )

  // 10. Students with no UGC ID (shouldn't happen after repair-ugc-links)
  const noLink = rows.filter(r => r.noUgcId)
  sep(`NO UGC ID LINK (${noLink.length})`)
  if (noLink.length === 0) console.log('  none')
  noLink.forEach(r => console.log(`  ${r.name} <${r.email}>`))

  // 11. Students with zero posts in UGC but non-zero points stored
  const zeroPosts = rows.filter(r => r.ugcPostCount === 0 && r.storedPts > 0)
  sep(`ZERO UGC POSTS but stored pts > 0 (${zeroPosts.length}) — orphaned points`)
  if (zeroPosts.length === 0) console.log('  none')
  zeroPosts.forEach(r =>
    console.log(`  ${r.name} <${r.email}>  stored: ${r.storedPts}pts  ugcId: ${r.ugcId ?? 'NONE'}`)
  )

  // 12. Summary stats
  sep('SUMMARY')
  const totalStudents = rows.length
  const matched       = rows.filter(r => !r.ptsMismatch && !r.streakMismatch).length
  const anyMismatch   = rows.filter(r => r.ptsMismatch || r.streakMismatch).length
  const totalUgcPts   = rows.reduce((s, r) => s + r.expectedPts, 0)
  const totalStored   = rows.reduce((s, r) => s + r.storedPts, 0)

  console.log(`Total students        : ${totalStudents}`)
  console.log(`Fully synced          : ${matched}`)
  console.log(`Any mismatch          : ${anyMismatch}`)
  console.log(`Overcounted (pts too high) : ${overCounted.length}`)
  console.log(`Undercounted (pts too low) : ${underCounted.length}`)
  console.log(`Streak mismatch       : ${streakMismatches.length}`)
  console.log(`No UGC ID             : ${noLink.length}`)
  console.log(`Total UGC posts       : ${allPosts.length} (${allPosts.filter(p => p.url?.startsWith('placeholder://')).length} placeholders)`)
  console.log(`Expected total pts    : ${totalUgcPts}`)
  console.log(`Stored total pts      : ${totalStored}`)
  console.log(`Delta                 : ${totalStored - totalUgcPts}`)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
