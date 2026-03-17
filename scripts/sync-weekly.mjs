/**
 * sync-weekly.mjs
 * Wrapper: runs attendance + ugc sync back-to-back.
 * Called by GitHub Actions every Sunday.
 *
 * Run: node scripts/sync-weekly.mjs
 */
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

function run(script) {
  console.log(`\n[*] Running ${script}...`)
  execSync(`node ${resolve(__dir, script)}`, { stdio: 'inherit' })
}

run('sync-attendance.mjs')
run('sync-ugc.mjs')
console.log('\n[OK] Weekly sync complete.')
