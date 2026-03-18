/**
 * bulk-import.mjs
 * One-time: import attendance from C7 start date to today, week by week.
 *
 * Run: node scripts/bulk-import.mjs
 */
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

const C7_START = new Date('2026-03-16T00:00:00Z')

function toUnix(d) { return Math.floor(d.getTime() / 1000) }

async function main() {
  const now = new Date()
  let cursor = new Date(C7_START)
  let week = 0

  // Attendance summary is cumulative — one call from cohort start to now is correct
  const start = toUnix(C7_START)
  const end   = toUnix(now)
  const startStr = C7_START.toISOString().split('T')[0]
  const endStr   = now.toISOString().split('T')[0]
  console.log(`\n[*] Attendance: ${startStr} --> ${endStr}`)
  try {
    execSync(`node ${resolve(__dir, 'sync-attendance.mjs')} ${start} ${end}`, { stdio: 'inherit' })
  } catch (e) {
    console.error('[ERROR] Attendance sync failed:', e.message)
  }

  // UGC sync once at the end
  console.log('\n[*] Final UGC sync...')
  execSync(`node ${resolve(__dir, 'sync-ugc.mjs')}`, { stdio: 'inherit' })

  console.log(`\n[OK] Bulk import complete. ${week} weeks processed.`)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
