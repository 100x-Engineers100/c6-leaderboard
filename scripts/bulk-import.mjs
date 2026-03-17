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

  while (cursor < now) {
    const start = toUnix(cursor)
    const end   = Math.min(toUnix(new Date(cursor.getTime() + 7 * 86400 * 1000)), toUnix(now))
    const startStr = new Date(start * 1000).toISOString().split('T')[0]
    const endStr   = new Date(end   * 1000).toISOString().split('T')[0]

    console.log(`\n[*] Week ${++week}: ${startStr} --> ${endStr}`)
    try {
      execSync(
        `node ${resolve(__dir, 'sync-attendance.mjs')} ${start} ${end}`,
        { stdio: 'inherit' }
      )
    } catch (e) {
      console.error('[ERROR] Week', week, 'failed:', e.message)
    }

    cursor = new Date(cursor.getTime() + 7 * 86400 * 1000)
  }

  // UGC sync once at the end
  console.log('\n[*] Final UGC sync...')
  execSync(`node ${resolve(__dir, 'sync-ugc.mjs')}`, { stdio: 'inherit' })

  console.log(`\n[OK] Bulk import complete. ${week} weeks processed.`)
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1) })
