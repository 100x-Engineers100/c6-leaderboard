/**
 * sync-ugc.mjs
 * Query UGC tracker DB for C7 posts + streaks, upsert cache, recalculate points.
 *
 * Run: node scripts/sync-ugc.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from './db.mjs'
import { ugcDb } from './ugc-db.mjs'

const C7_COHORT_ID = '4c8458b3-a700-42b2-9cc1-f52b3045e2c3'
const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')

// Load UGC users from DB, fall back to exported CSV
async function loadUgcUsers() {
  const { data, error } = await ugcDb
    .from('User')
    .select('id, email')
    .eq('cohortId', C7_COHORT_ID)

  if (!error) {
    console.log(`[OK] ${data.length} C7 UGC users from DB`)
    return data
  }

  console.warn('[WARN] UGC DB access failed:', error.message)
  console.log('[*] Falling back to docs/User_rows_ugc.csv...')
  const text = readFileSync(resolve(ROOT, 'docs/User_rows_ugc.csv'), 'utf8')
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',')
  const idIdx    = headers.indexOf('id')
  const emailIdx = headers.indexOf('email')
  const users = []
  for (let i = 1; i < lines.length; i++) {
    const cols  = lines[i].split(',')
    const id    = cols[idIdx]?.trim()
    const email = cols[emailIdx]?.trim()
    if (id && email) users.push({ id, email })
  }
  console.log(`[OK] ${users.length} C7 UGC users from CSV fallback`)
  return users
}

async function main() {
  console.log('[*] Fetching C7 students from leaderboard DB...')
  const { data: students, error: sErr } = await db
    .from('students')
    .select('id, email, ugc_user_id')
    .eq('cohort', 'C7')
  if (sErr) { console.error('[ERROR]', sErr.message); process.exit(1) }

  console.log(`[OK] ${students.length} C7 students loaded`)

  // 1. Get C7 UGC users (DB or CSV fallback)
  console.log('[*] Fetching C7 users from UGC tracker...')
  const ugcUsers = await loadUgcUsers()

  // Build cross-reference maps
  const ugcEmailMap = new Map(ugcUsers.map(u => [u.email.toLowerCase(), u.id]))
  const lbEmailMap  = new Map(students.map(s => [s.email.toLowerCase(), s]))

  // Update ugc_user_id for students that weren't matched during seed
  const toUpdate = students.filter(s => !s.ugc_user_id && ugcEmailMap.has(s.email.toLowerCase()))
  if (toUpdate.length) {
    console.log(`[*] Updating ${toUpdate.length} ugc_user_id links...`)
    for (const s of toUpdate) {
      await db.from('students').update({ ugc_user_id: ugcEmailMap.get(s.email.toLowerCase()) }).eq('id', s.id)
      s.ugc_user_id = ugcEmailMap.get(s.email.toLowerCase())
    }
  }

  // ugcUserId -> leaderboard student
  const ugcIdToLb = new Map()
  for (const s of students) {
    if (s.ugc_user_id) ugcIdToLb.set(s.ugc_user_id, s)
    // also try matching via email if ugc_user_id not set
    const ugcId = ugcEmailMap.get(s.email.toLowerCase())
    if (ugcId) ugcIdToLb.set(ugcId, s)
  }

  const c7UgcIds = ugcUsers.map(u => u.id)
  if (!c7UgcIds.length) { console.log('[WARN] No C7 UGC users found.'); return }

  // 2. Fetch posts
  console.log('[*] Fetching UGC posts...')
  const { data: posts, error: pErr } = await ugcDb
    .from('Post')
    .select('id, userId, url, platform, numLikes, numComments, postedAt')
    .in('userId', c7UgcIds)
  if (pErr) { console.error('[ERROR] Posts fetch:', pErr.message, '\n[INFO] Fix UGC DB permissions — run the GRANT SQL in UGC Supabase SQL editor, then retry.'); process.exit(1) }
  console.log(`[OK] ${posts.length} posts found`)

  // 3. Upsert ugc_posts_cache
  const postRows = posts.map(p => {
    const lb = ugcIdToLb.get(p.userId)
    return {
      student_id: lb?.id ?? null,
      post_url:   p.url,
      num_likes:  p.numLikes   ?? 0,
      num_comments: p.numComments ?? 0,
      posted_at:  p.postedAt ?? null,
      platform:   p.platform ?? 'LINKEDIN',
    }
  }).filter(r => r.student_id)

  const BATCH = 200
  let cached = 0
  for (let i = 0; i < postRows.length; i += BATCH) {
    const { error } = await db
      .from('ugc_posts_cache')
      .upsert(postRows.slice(i, i + BATCH), { onConflict: 'post_url' })
    if (error) console.warn('[WARN] posts upsert:', error.message)
    else cached += Math.min(BATCH, postRows.length - i)
  }
  console.log(`[OK] Cached ${cached} posts`)

  // 4. Fetch streaks
  console.log('[*] Fetching UGC streaks...')
  const { data: streaks, error: stErr } = await ugcDb
    .from('Streak')
    .select('userId, weeklyStreak')
    .in('userId', c7UgcIds)
  if (stErr) { console.warn('[WARN] Streaks fetch:', stErr.message) }

  // 5. Calculate per-student points
  const postCountByLbId = new Map()
  for (const p of postRows) {
    postCountByLbId.set(p.student_id, (postCountByLbId.get(p.student_id) || 0) + 1)
  }

  const streakByUgcId = new Map((streaks || []).map(s => [s.userId, s.weeklyStreak || 0]))

  const pointUpdates = []
  for (const s of students) {
    const ugcId = s.ugc_user_id || ugcEmailMap.get(s.email.toLowerCase())
    const postCount = postCountByLbId.get(s.id) || 0
    const weeklyStreak = ugcId ? (streakByUgcId.get(ugcId) || 0) : 0
    pointUpdates.push({
      student_id:           s.id,
      ugc_post_pts:         postCount * 20,
      consistency_bonus_pts: weeklyStreak * 10,
      last_synced_at:       new Date().toISOString(),
    })
  }

  for (let i = 0; i < pointUpdates.length; i += BATCH) {
    const { error } = await db
      .from('student_points')
      .upsert(pointUpdates.slice(i, i + BATCH), { onConflict: 'student_id' })
    if (error) console.warn('[WARN] points upsert:', error.message)
  }
  console.log(`[OK] Updated UGC points for ${pointUpdates.length} students`)

  // Summary
  const totalPosts = postRows.length
  const withPosts = postCountByLbId.size
  const withStreak = [...streakByUgcId.values()].filter(v => v > 0).length
  console.log(`\n[OK] UGC sync complete`)
  console.log(`     Total posts      : ${totalPosts}`)
  console.log(`     Students w/ posts: ${withPosts}`)
  console.log(`     Students w/ streak: ${withStreak}`)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
