/**
 * test-score-parsing.mjs
 * Local unit tests for CSV parsing + point calculation logic.
 * No DB connection required.
 *
 * Run: node scripts/test-score-parsing.mjs
 */

// Copied from process-score-upload.mjs
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

function calculatePoints(eventType, rows) {
  const result = new Map()

  if (eventType.startsWith('assignment_')) {
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
    const emailMaxMarks = new Map()
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
    emailMaxMarks.forEach((maxMarks, email) => {
      const rawScore = maxMarks >= 0 ? maxMarks : 0
      result.set(email, { points: 30 + rawScore, rawScore })
    })
  } else if (eventType === 'hackathon_1') {
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

let passed = 0
let failed = 0

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`[OK]   ${label}`)
    passed++
  } else {
    console.log(`[FAIL] ${label}`)
    console.log(`       expected: ${expected}`)
    console.log(`       actual:   ${actual}`)
    failed++
  }
}

function assertThrows(label, fn) {
  try {
    fn()
    console.log(`[FAIL] ${label} (expected throw but did not)`)
    failed++
  } catch (e) {
    console.log(`[OK]   ${label}`)
    passed++
  }
}

// --- Test 1: Assignment -- duplicates, max wins ---
console.log('\n[*] Test 1: Assignment basic')
const assignmentCSV = `"Submissions Export"
SNo.,Name,Email,Mobile,Assessment name,Evaluation status,Latest,Type,Marks obtained,Total
1,Alice,alice@test.com,1234,Assignment 1,EVALUATED,2026,Assignment,13,20
2,Alice,alice@test.com,1234,Assignment 1,EVALUATED,2026,Assignment,18,20
3,Alice,alice@test.com,1234,Assignment 1,EVALUATED,2026,Assignment,17,20
4,Bob,bob@test.com,5678,Assignment 1,NOT EVALUATED,2026,Assignment,0,20
5,Charlie,charlie@test.com,9012,Assignment 1,EVALUATED,2026,Assignment,15,20
`

const assignRows = parseCSV(assignmentCSV)
const assignPoints = calculatePoints('assignment_1', assignRows)

assert('assignment: alice gets max of 13/18/17 = 18', assignPoints.get('alice@test.com')?.points, 18)
assert('assignment: bob (not evaluated) excluded', assignPoints.get('bob@test.com'), undefined)
assert('assignment: charlie gets 15', assignPoints.get('charlie@test.com')?.points, 15)
assert('assignment: only 2 students (alice+charlie)', assignPoints.size, 2)

// --- Test 2: Assignment -- case-insensitive status ---
console.log('\n[*] Test 2: Assignment case-insensitive status')
const assignCaseCSV = `"Submissions Export"
SNo.,Name,Email,Mobile,Assessment name,Evaluation status,Latest,Type,Marks obtained,Total
1,Dave,dave@test.com,1111,Assignment 1,Evaluated,2026,Assignment,16,20
2,Eve,eve@test.com,2222,Assignment 1,evaluated,2026,Assignment,12,20
3,Frank,frank@test.com,3333,Assignment 1,NOT EVALUATED,2026,Assignment,0,20
`

const assignCaseRows = parseCSV(assignCaseCSV)
const assignCasePoints = calculatePoints('assignment_1', assignCaseRows)

assert('assignment case-insensitive: Evaluated accepted', assignCasePoints.get('dave@test.com')?.points, 16)
assert('assignment case-insensitive: evaluated (lowercase) accepted', assignCasePoints.get('eve@test.com')?.points, 12)
assert('assignment case-insensitive: NOT EVALUATED excluded', assignCasePoints.get('frank@test.com'), undefined)

// --- Test 3: MidCapstone -- base 30 + marks ---
console.log('\n[*] Test 3: MidCapstone basic')
const midCapCSV = `"Submissions Export"
SNo.,Name,Email,Mobile,Assessment name,Evaluation status,Latest,Type,Marks obtained,Total
1,Alice,alice@test.com,1234,Mid Capstone,EVALUATED,2026,Assignment,17,20
2,Bob,bob@test.com,5678,Mid Capstone,NOT EVALUATED,2026,Assignment,0,20
3,Charlie,charlie@test.com,9012,Mid Capstone,EVALUATED,2026,Assignment,10,20
4,Charlie,charlie@test.com,9012,Mid Capstone,EVALUATED,2026,Assignment,14,20
`

const midRows = parseCSV(midCapCSV)
const midPoints = calculatePoints('midcapstone', midRows)

assert('midcapstone: alice (evaluated 17) gets 30+17=47', midPoints.get('alice@test.com')?.points, 47)
assert('midcapstone: bob (not evaluated) gets base 30', midPoints.get('bob@test.com')?.points, 30)
assert('midcapstone: bob rawScore is 0', midPoints.get('bob@test.com')?.rawScore, 0)
assert('midcapstone: charlie (evaluated 10,14) gets max=14, so 30+14=44', midPoints.get('charlie@test.com')?.points, 44)
assert('midcapstone: 3 unique students', midPoints.size, 3)

// --- Test 4: MidCapstone -- case-insensitive status ---
console.log('\n[*] Test 4: MidCapstone case-insensitive status')
const midCaseCSV = `"Submissions Export"
SNo.,Name,Email,Mobile,Assessment name,Evaluation status,Latest,Type,Marks obtained,Total
1,Dave,dave@test.com,1111,Mid Capstone,Evaluated,2026,Assignment,15,20
2,Eve,eve@test.com,2222,Mid Capstone,not evaluated,2026,Assignment,0,20
`

const midCaseRows = parseCSV(midCaseCSV)
const midCasePoints = calculatePoints('midcapstone', midCaseRows)

assert('midcapstone case-insensitive: Evaluated accepted, 30+15=45', midCasePoints.get('dave@test.com')?.points, 45)
assert('midcapstone case-insensitive: not evaluated gets base 30', midCasePoints.get('eve@test.com')?.points, 30)

// --- Test 5: Hackathon -- max total per email, header scan ---
console.log('\n[*] Test 5: Hackathon header scan (standard position)')
const hackathonCSV = `Name,Email,Track,Problem,Discord,JSON,GitHub,Loom,"Live link
",MVP,Presentation,Technical,Innovation,Alignment,Total Points(100),
Alice,alice@test.com,Code,Custom,alice_disc,,https://github.com/a,https://loom.com/a,https://a.vercel.app/,20,15,16,10,10,71,
Bob,bob@test.com,No-Code,Custom,bob_disc,,,,https://b.app,15,10,10,8,8,51,
Alice,alice@test.com,Code,Custom,alice_disc,,,,https://a2.app,25,18,15,10,10,78,
`

const hackRows = parseCSV(hackathonCSV)
const hackPoints = calculatePoints('hackathon_1', hackRows)

assert('hackathon: alice (71 and 78) gets max=78', hackPoints.get('alice@test.com')?.points, 78)
assert('hackathon: bob gets 51', hackPoints.get('bob@test.com')?.points, 51)
assert('hackathon: 2 unique students', hackPoints.size, 2)

// --- Test 6: Hackathon -- mixed-case headers, different column order ---
console.log('\n[*] Test 6: Hackathon mixed-case headers')
const hackCaseCSV = `Track,EMAIL,Name,TOTAL POINTS(100)
Code,alice@test.com,Alice,65
No-Code,bob@test.com,Bob,40
Code,alice@test.com,Alice,72
`

const hackCaseRows = parseCSV(hackCaseCSV)
const hackCasePoints = calculatePoints('hackathon_1', hackCaseRows)

assert('hackathon case-insensitive: EMAIL header found', hackCasePoints.get('alice@test.com') !== undefined, true)
assert('hackathon case-insensitive: alice gets max=72', hackCasePoints.get('alice@test.com')?.points, 72)
assert('hackathon case-insensitive: bob gets 40', hackCasePoints.get('bob@test.com')?.points, 40)

// --- Test 7: Hackathon -- throws if Email column missing ---
console.log('\n[*] Test 7: Hackathon throws on missing Email column')
const hackBadCSV = `Name,Track,Score
Alice,Code,55
`
const hackBadRows = parseCSV(hackBadCSV)
assertThrows('hackathon: throws when Email col missing', () => calculatePoints('hackathon_1', hackBadRows))

// --- Test 8: Final Capstone -- C7 simple format (Name,Email) ---
console.log('\n[*] Test 8: Final Capstone C7 simple format')
const finalC7CSV = `Name,Email
Kshitij,gunjalkarkshitij@gmail.com
Prasad,prasadkachawar@gmail.com
Anmol,amworksssss@gmail.com
No Email Student,
Another Empty,
`

const finalC7Rows = parseCSV(finalC7CSV)
const finalC7Points = calculatePoints('final_capstone', finalC7Rows)

assert('final_capstone C7: kshitij gets 200', finalC7Points.get('gunjalkarkshitij@gmail.com')?.points, 200)
assert('final_capstone C7: prasad gets 200', finalC7Points.get('prasadkachawar@gmail.com')?.points, 200)
assert('final_capstone C7: anmol gets 200', finalC7Points.get('amworksssss@gmail.com')?.points, 200)
assert('final_capstone C7: empty email rows skipped', finalC7Points.size, 3)

// --- Test 9: Final Capstone -- email col found mid-file ---
console.log('\n[*] Test 9: Final Capstone email column detected mid-file')
const finalMidCSV = `,,Mail Id,Code/nocode,Project Link
Some Header Row,,,,,
,,Name,Mail,,
,,Alice Member,alice@test.com,,
,,Bob Member,bob@test.com,,
`

const finalMidRows = parseCSV(finalMidCSV)
const finalMidPoints = calculatePoints('final_capstone', finalMidRows)

assert('final_capstone mid-file: alice gets 200', finalMidPoints.get('alice@test.com')?.points, 200)
assert('final_capstone mid-file: bob gets 200', finalMidPoints.get('bob@test.com')?.points, 200)
assert('final_capstone mid-file: only 2 students', finalMidPoints.size, 2)

// --- Test 10: Final Capstone -- throws if no email column ---
console.log('\n[*] Test 10: Final Capstone throws on missing Email column')
const finalBadCSV = `Name,Score
Alice,100
Bob,80
`
const finalBadRows = parseCSV(finalBadCSV)
assertThrows('final_capstone: throws when Email col missing', () => calculatePoints('final_capstone', finalBadRows))

// --- Summary ---
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
