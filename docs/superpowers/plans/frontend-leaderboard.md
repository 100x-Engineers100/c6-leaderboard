# C6 Leaderboard Frontend — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully animated, public-facing leaderboard page for 100xEngineers Cohort 7 — pixel art TV podium for top 3, ranked list with pagination, all dummy data, no backend.

**Architecture:** Next.js App Router single-page app. Top 1/3 = R3F particle background + 3 GSAP-animated pixel art TVs (podium). Bottom 2/3 = flat rank/name/points table with Google-style pagination. All data from static dummy JSON. Lenis for smooth scroll.

**Tech Stack:** Next.js 14 (App Router) · React Three Fiber + Three.js · GSAP · Lenis · Tailwind CSS · TypeScript

**Spec:** `docs/superpowers/specs/2026-03-10-leaderboard-design.md`

---

## Aesthetic North Star

> Read this before writing a single line of code. Every decision should pass these filters.

**Minimal:** If it doesn't serve a function, remove it. No decorative borders, gradients, or shadows that don't communicate hierarchy. The dark background does the heavy lifting — let it breathe.

**Abstract:** The particle background is not literal. It is depth, atmosphere, texture. The TVs are not cute retro — they are structural anchors. Keep the pixel art intentional and geometric, not playful.

**Restrained color:** `#F96846` appears only on rank #1, active states, and the live pill. Everything else is white at varying opacities (`rgba(255,255,255,0.9)` down to `0.15`). If you find yourself adding orange to a 4th element, remove it.

**Typography discipline:** Numbers in `JetBrains Mono`. Everything else in `Space Grotesk`. No mixing. Headings tight-tracked. Labels uppercase with 3-4px letter-spacing. Body text at 0.65-0.8 opacity, never full white.

**Spacing:** 4px grid, always. No `margin: 7px`. No `padding: 11px`. Round to the nearest 4.

**Animation principle:** Animations exist to reveal, not to impress. The TV drop happens once on load. The row stagger happens once. Nothing loops except the live dot and particle rotation. Resist the urge to add more.

---

## File Map

```
app/
  layout.tsx                        root layout, fonts, metadata
  page.tsx                          single page assembly
  globals.css                       design tokens (CSS vars), keyframes

components/
  navbar/
    Navbar.tsx                      glassmorphism fixed nav
  hero/
    HeroSection.tsx                 hero wrapper: R3F canvas + podium
    R3FBackground.tsx               Three.js particle field (client-only)
    PodiumTVs.tsx                   3-TV container with GSAP stagger
    PixelTV.tsx                     individual pixel art CRT TV
  leaderboard/
    LeaderboardSection.tsx          section wrapper
    RankTable.tsx                   pagination state + row mapping
    RankRow.tsx                     single rank row
    Pagination.tsx                  page number controls

lib/
  types.ts                          Student type
  dummy-data.ts                     200 dummy students
  constants.ts                      PAGE_SIZE=20

hooks/
  useLenis.ts                       smooth scroll init + cleanup
  usePodiumAnimation.ts             GSAP TV drop sequence
```

---

## Stage Overview

| Stage | What | Gate Before Next |
|---|---|---|
| 1 | Foundation: deps + design tokens | Dark bg renders, no CSS errors |
| 2 | Data layer: types + dummy data | 200 students, top3 correct |
| 3 | Navbar | Glassmorphism bar visible, dot blinks |
| 4 | Pixel art TVs + GSAP drop | All 3 TVs animate correctly, elastic |
| 5 | R3F particle background | Particles rotate behind TVs, no perf issues |
| 6 | Leaderboard table + pagination | 20 rows/page, page change animates |
| 7 | Final assembly + Lenis | Full page works end-to-end, smooth scroll |

**Rule: Do not start the next stage until the current stage gate passes completely.**

---

## Stage 1: Foundation

**Goal:** Working Next.js app with design tokens applied. Nothing visual yet except the correct background color.

### Task 1: Install dependencies

**Files:** `package.json`

- [x] **Install packages** — used @react-three/fiber@8.18.0 + @react-three/drei@9.122.0 (React 18 compatible; v9 requires React 19)

- [x] **Verify** — `[OK] deps ok`

---

### Task 2: Design tokens

**Files:** `app/globals.css`, `tailwind.config.ts`

- [x] **Write globals.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary:          #FF6B35;
  --color-secondary:        #F96846;
  --color-bg:               #0A0A0A;
  --color-surface:          #141414;
  --color-surface-elevated: #1A1A1A;
  --color-text-primary:     #FFFFFF;
  --color-text-secondary:   #A0A0A0;
  --color-text-muted:       #666666;
  --color-border:           #2A2A2A;
  --color-border-accent:    #F96846;
  --color-success:          #22C55E;
  --color-warning:          #EAB308;
  --color-error:            #EF4444;

  --glass-bg:     rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur:   blur(24px) saturate(120%);

  --shadow-subtle: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-medium: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-strong: 0 8px 24px rgba(0,0,0,0.15);
  --shadow-glow:   0 0 24px rgba(249,104,70,0.25);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: 'Space Grotesk', sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0A0A0A; }
::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #F96846; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

- [x] **Update tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary:            'var(--color-primary)',
        secondary:          'var(--color-secondary)',
        surface:            'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border:             'var(--color-border)',
        'border-accent':    'var(--color-border-accent)',
        muted:              'var(--color-text-muted)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
}
export default config
```

- [x] **Scaffold minimal page.tsx**

```tsx
// app/page.tsx
export default function Page() {
  return <main className="min-h-screen" style={{ background: 'var(--color-bg)' }} />
}
```

- [x] **Commit** — skipped (no git init in root; will init once all stages done)

---

### Stage 1 Gate — MUST PASS BEFORE STAGE 2

```
[OK] npm run dev starts without error
[OK] http://localhost:3000 shows #0A0A0A background (not white)
[OK] Browser console: zero errors
[OK] View source: Space Grotesk font loading from Google Fonts
[OK] node_modules has: three, gsap, lenis, @react-three/fiber
```

**If #0A0A0A is not showing:** Tailwind is purging the inline style. Use `style={{ background: '#0A0A0A' }}` directly on body in layout.tsx as fallback.

---

### Stage 1 Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Google Fonts blocked | Space Grotesk falls back to system font | Add font to `next/font/google` instead of CSS import |
| Tailwind not processing globals.css | Tokens undefined | Check `content` array in tailwind.config includes `app/**` |
| `three` import error in server component | `Cannot find module 'three'` | Add `'use client'` to any file importing three |
| CSS vars not resolving in Tailwind | `bg-primary` shows nothing | Wrap var in `hsl()` or use direct hex — Tailwind requires specific format |

---

## Stage 2: Data Layer

**Goal:** Static dummy data ready. Types locked. Nothing visual.

### Task 3: Types + constants

**Files:** `lib/types.ts`, `lib/constants.ts`

- [x] **Write types.ts**

```ts
// lib/types.ts
export type Student = {
  id: string
  rank: number
  name: string
  points: number
  avatar?: string
}
```

- [x] **Write constants.ts**

```ts
// lib/constants.ts
export const PAGE_SIZE = 20
```

- [ ] **Commit**

```bash
git add lib/types.ts lib/constants.ts
git commit -m "feat: student type + page size constant"
```

---

### Task 4: Dummy data

**Files:** `lib/dummy-data.ts`

- [x] **Write dummy-data.ts**

```ts
// lib/dummy-data.ts
import type { Student } from './types'

const NAMES = [
  'Arjun Kapoor', 'Sneha Rathi', 'Vikram Mehta', 'Priya Joshi', 'Rahul Desai',
  'Ananya Singh', 'Karan Verma', 'Divya Sharma', 'Rohan Gupta', 'Neha Patel',
  'Aditya Kumar', 'Pooja Nair', 'Siddharth Rao', 'Kavya Reddy', 'Manish Shah',
  'Shreya Iyer', 'Nikhil Bose', 'Ritika Malhotra', 'Varun Tiwari', 'Swati Mishra',
]

function generateStudents(): Student[] {
  const students: Student[] = []
  for (let i = 0; i < 200; i++) {
    const baseName = NAMES[i % NAMES.length]
    const suffix = Math.floor(i / NAMES.length)
    students.push({
      id: `student-${i + 1}`,
      rank: i + 1,
      name: suffix === 0 ? baseName : `${baseName} ${suffix + 1}`,
      points: Math.max(100, 10000 - i * 48 - Math.floor(Math.random() * 20)),
    })
  }
  return students
}

export const STUDENTS: Student[] = generateStudents()
export const TOP_3 = STUDENTS.slice(0, 3)
```

- [x] **Verify via npx tsx**

```bash
npx tsx -e "
import { STUDENTS, TOP_3 } from './lib/dummy-data'
console.log('[OK] total:', STUDENTS.length)
console.log('[OK] top3:', TOP_3.map(s => s.name + ' — ' + s.points + 'pts'))
console.log('[OK] last:', STUDENTS[199].rank, STUDENTS[199].points)
"
```

Expected:
```
[OK] total: 200
[OK] top3: [ 'Arjun Kapoor — 10000pts', 'Sneha Rathi — 9952pts', 'Vikram Mehta — 9904pts' ]
[OK] last: 200 100
```

- [ ] **Commit**

```bash
git add lib/dummy-data.ts
git commit -m "feat: 200 student dummy dataset"
```

---

### Stage 2 Gate — MUST PASS BEFORE STAGE 3

```
[OK] STUDENTS.length === 200
[OK] TOP_3[0].rank === 1
[OK] Points are descending (TOP_3[0].points > TOP_3[1].points > TOP_3[2].points)
[OK] STUDENTS[199].points >= 100 (floor enforced)
[OK] No TypeScript errors: npx tsc --noEmit
```

---

### Stage 2 Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Random points not descending | Ranks out of order | `points` formula uses `i` as base — Math.random() offset must be small |
| `npx tsx` not available | Command not found | `npm install -D tsx` or test in the browser instead |
| Import path wrong | Module not found | Use `@/lib/dummy-data` in Next.js — configure `@` alias in tsconfig |

---

## Stage 3: Navbar

**Goal:** Fixed glassmorphism navbar visible at top. Live pill blinking. Nothing else.

### Task 5: Navbar component

**Files:** `components/navbar/Navbar.tsx`, `app/page.tsx`

**Aesthetic notes:**
- Brand text: small, very low opacity (`text-white/45`). It is a label, not a headline.
- Live pill: orange-tinted, not full orange. It signals status, not importance.
- The navbar should feel like it's floating — glassmorphism means you see content through it.
- Do not add navigation links, hamburger menus, or any extra chrome. Just brand + status.

- [x] **Write Navbar.tsx** — upgraded to frozen glassmorphism from Community Events: rgba(10,10,10,0.60) bg, blur(24px) saturate(180%), inset top-edge highlight, floating pill shape

```tsx
// components/navbar/Navbar.tsx
'use client'

export function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <span className="font-sans text-xs tracking-[4px] uppercase text-white/45">
        100xEngineers
      </span>

      <div
        className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase"
        style={{
          background: 'rgba(249,104,70,0.10)',
          border: '1px solid rgba(249,104,70,0.22)',
          color: 'rgba(249,104,70,0.85)',
        }}
      >
        <span
          className="w-[5px] h-[5px] rounded-full"
          style={{
            background: '#F96846',
            animation: 'blink 2s ease-in-out infinite',
          }}
        />
        C6 Live
      </div>
    </nav>
  )
}
```

- [x] **Add to page.tsx**

```tsx
// app/page.tsx
import { Navbar } from '@/components/navbar/Navbar'
export default function Page() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />
      <div style={{ height: '200vh' }} />
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add components/navbar/Navbar.tsx app/page.tsx
git commit -m "feat: stage 3 — glassmorphism navbar"
```

---

### Stage 3 Gate — MUST PASS BEFORE STAGE 4

```
[OK] Navbar fixed at top, doesn't scroll away
[OK] Glassmorphism visible: content blurs behind it when scrolled
[OK] Live dot blinks at ~2s interval
[OK] Brand text is visually subdued (not bold, not bright)
[OK] No layout shift on page load
[OK] Mobile: navbar fits on 375px without overflow
```

---

### Stage 3 Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| `backdropFilter` has no effect | Solid background, no blur | Must have a semi-transparent background for backdrop-filter to work. `rgba(255,255,255,0)` = fully transparent = no blur visible |
| Navbar covers hero content | TVs hidden behind nav | Add `paddingTop: 52px` (nav height) to hero section |
| `z-50` not enough | Other elements overlap nav | R3F Canvas default z-index can be high — explicitly set `z-index: 0` on canvas container |
| Blink animation not working | Static dot | Check `@keyframes blink` is defined in globals.css and not being purged |

---

## Stage 4: Pixel Art TVs + GSAP Drop Animation

**Goal:** Three pixel art CRT TVs render with correct rank colors. GSAP drop animation fires on page load — #1 first, then #2 and #3 together.

### Task 6: PixelTV component

**Files:** `components/hero/PixelTV.tsx`

**Aesthetic notes:**
- The TV is geometric, not cute. Hard edges, minimal rounding.
- Three visible layers: outer body (dark surface) → screen border (rank color) → screen interior (near-black).
- Scanlines are subtle — `rgba(0,0,0,0.15)` only. If they're visible as distinct lines to naked eye from normal distance, reduce opacity.
- Rank glow is a `box-shadow` on the TV body, not a separate div. Keep it diffuse, not sharp.
- Antenna knobs: 2 small rectangles top of TV. They are structural detail, 6px wide max.
- Initials fallback: large, centered, rank color. Clean. No background gradient.

- [x] **Write PixelTV.tsx**

```tsx
// components/hero/PixelTV.tsx
'use client'
import type { Student } from '@/lib/types'

type Props = {
  student: Student
  rank: 1 | 2 | 3
  size?: 'lg' | 'md'
}

const RANK_COLORS = {
  1: { border: '#F96846', glow: 'rgba(249,104,70,0.30)', text: '#F96846' },
  2: { border: 'rgba(232,160,32,0.55)', glow: 'rgba(232,160,32,0.15)', text: '#E8A020' },
  3: { border: 'rgba(160,160,160,0.30)', glow: 'rgba(160,160,160,0.08)', text: 'rgba(200,200,200,0.70)' },
}

export function PixelTV({ student, rank, size = 'md' }: Props) {
  const color = RANK_COLORS[rank]
  const isLg = size === 'lg'

  const tvW  = isLg ? 160 : 130
  const tvH  = isLg ? 140 : 115
  const scrW = isLg ? 110 : 88
  const scrH = isLg ? 82  : 66

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* TV body */}
      <div style={{
        width: tvW, height: tvH,
        background: '#1A1A1A',
        border: `3px solid ${color.border}`,
        borderRadius: 8,
        boxShadow: `0 0 28px ${color.glow}, 0 8px 24px rgba(0,0,0,0.6)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Antenna left */}
        <div style={{
          position: 'absolute', top: -10, left: '30%',
          width: 6, height: 10,
          background: color.border,
          borderRadius: '2px 2px 0 0',
        }} />
        {/* Antenna right */}
        <div style={{
          position: 'absolute', top: -10, right: '30%',
          width: 6, height: 10,
          background: color.border,
          borderRadius: '2px 2px 0 0',
        }} />

        {/* Screen */}
        <div style={{
          width: scrW, height: scrH,
          background: '#0A0A0A',
          border: `2px solid ${color.border}`,
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Photo or initials */}
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isLg ? 26 : 20,
              fontWeight: 700,
              color: color.text,
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '2px',
            }}>
              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* Scanlines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
            pointerEvents: 'none',
          }} />

          {/* Corner glare */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 35%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Control dots */}
        <div style={{ position: 'absolute', bottom: 8, right: 10, display: 'flex', gap: 3 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: 1,
              background: i === 1 ? color.border : 'rgba(255,255,255,0.08)',
            }} />
          ))}
        </div>
      </div>

      {/* Rank */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: isLg ? 20 : 16,
        fontWeight: 700,
        color: color.text,
        textShadow: `0 0 14px ${color.glow}`,
      }}>
        #{rank}
      </div>

      {/* Name */}
      <div style={{
        fontSize: isLg ? 12 : 11,
        fontWeight: 500,
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        maxWidth: tvW,
        lineHeight: 1.4,
        letterSpacing: '0.3px',
      }}>
        {student.name}
      </div>

      {/* Points */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: isLg ? 13 : 11,
        fontWeight: 700,
        color: color.text,
        letterSpacing: '1px',
      }}>
        {student.points.toLocaleString()} pts
      </div>
    </div>
  )
}
```

- [ ] **Smoke test: add single TV to page**

```tsx
// In app/page.tsx temporarily under Navbar:
import { PixelTV } from '@/components/hero/PixelTV'
import { TOP_3 } from '@/lib/dummy-data'
// Add: <div style={{padding:100}}><PixelTV student={TOP_3[0]} rank={1} size="lg" /></div>
```

Verify: TV body renders, screen shows initials, rank badge below, name + points visible.

- [ ] **Commit**

```bash
git add components/hero/PixelTV.tsx
git commit -m "feat: pixel art CRT TV component"
```

---

### Task 7: GSAP drop animation + PodiumTVs

**Files:** `hooks/usePodiumAnimation.ts`, `components/hero/PodiumTVs.tsx`

- [x] **Write usePodiumAnimation.ts** — slowed to back.out(1.4) at 1.1s/#1, 1.0s/#2+3 per user request

```ts
// hooks/usePodiumAnimation.ts
'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function usePodiumAnimation() {
  const tv1Ref = useRef<HTMLDivElement>(null)
  const tv2Ref = useRef<HTMLDivElement>(null)
  const tv3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([tv1Ref.current, tv2Ref.current, tv3Ref.current], {
        y: -260,
        opacity: 0,
      })

      const tl = gsap.timeline({ delay: 0.3 })

      // #1 drops first
      tl.to(tv1Ref.current, {
        y: 0, opacity: 1,
        duration: 0.75,
        ease: 'elastic.out(1, 0.55)',
      })

      // #2 and #3 drop together, slight overlap
      tl.to(
        [tv2Ref.current, tv3Ref.current],
        { y: 0, opacity: 1, duration: 0.75, ease: 'elastic.out(1, 0.55)' },
        '-=0.35'
      )
    })

    return () => ctx.revert()
  }, [])

  return { tv1Ref, tv2Ref, tv3Ref }
}
```

- [x] **Write PodiumTVs.tsx**

```tsx
// components/hero/PodiumTVs.tsx
'use client'
import { PixelTV } from './PixelTV'
import { usePodiumAnimation } from '@/hooks/usePodiumAnimation'
import { TOP_3 } from '@/lib/dummy-data'

export function PodiumTVs() {
  const { tv1Ref, tv2Ref, tv3Ref } = usePodiumAnimation()

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 48, padding: '0 16px' }}>
      <div ref={tv2Ref}>
        <PixelTV student={TOP_3[1]} rank={2} size="md" />
      </div>
      <div ref={tv1Ref}>
        <PixelTV student={TOP_3[0]} rank={1} size="lg" />
      </div>
      <div ref={tv3Ref}>
        <PixelTV student={TOP_3[2]} rank={3} size="md" />
      </div>
    </div>
  )
}
```

- [ ] **Test animation: replace page.tsx temporarily**

```tsx
// app/page.tsx
'use client'
import { Navbar } from '@/components/navbar/Navbar'
import { PodiumTVs } from '@/components/hero/PodiumTVs'

export default function Page() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navbar />
      <PodiumTVs />
    </main>
  )
}
```

Hard-refresh browser. Watch drop sequence carefully.

- [ ] **Commit**

```bash
git add hooks/usePodiumAnimation.ts components/hero/PodiumTVs.tsx
git commit -m "feat: GSAP elastic TV drop animation"
```

---

### Stage 4 Gate — MUST PASS BEFORE STAGE 5

```
[OK] #1 TV (center, larger) drops in first with elastic bounce
[OK] #2 and #3 drop simultaneously ~0.35s after #1 starts
[OK] All TVs land precisely at y:0 — no floating offset
[OK] TVs start fully hidden (no flash of content before animation)
[OK] Hard refresh: animation replays correctly every time
[OK] Rank colors correct: #1=orange, #2=amber, #3=grey
[OK] Initials fallback shows: 2 uppercase letters, rank color
[OK] No GSAP warnings in console
```

---

### Stage 4 Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| TVs flash visible before animation | Content visible for 1 frame | Move `gsap.set()` before `gsap.timeline()` — set must run synchronously |
| Elastic overshoots off screen | TV bounces past top of viewport | Reduce `y: -260` start position or use `elastic.out(0.8, 0.6)` |
| Animation runs twice in dev | Double drop on mount | React StrictMode double-invokes effects — use `gsap.context()` and return `ctx.revert()`. Already in code above. |
| `gsap.context()` scope issue | Refs are null inside context | Pass the parent element to `gsap.context(scope)` or target refs directly (as above) |
| TVs not aligned at bottom | #1 floats above #2/#3 | Use `alignItems: 'flex-end'` on container — #1 is taller, so flex-end aligns their bases |

---

## Stage 5: R3F Particle Background

**Goal:** Subtle particle field rotates slowly behind the TVs. Transparent canvas, no interaction.

### Task 8: R3F particle field + HeroSection

**Files:** `components/hero/R3FBackground.tsx`, `components/hero/HeroSection.tsx`

**Aesthetic notes:**
- Particles are white, small, low opacity — they are stars, not confetti.
- Rotation is almost imperceptible: `0.008` y-axis per frame. If you notice it moving, it's too fast.
- The canvas is `pointer-events: none` — it never intercepts clicks.
- The gradient fade at the bottom of the hero is critical. Without it, the particle field has a hard edge against the table. Keep `height: 40%` on the fade div.
- Do not add colored particles, particle connections (lines), or mouse interaction. Abstract = restrained.

- [x] **Write R3FBackground.tsx**

```tsx
// components/hero/R3FBackground.tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function Particles({ count = 1000 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8
    }
    return arr
  }, [count])

  useFrame((_, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.y += delta * 0.008
    mesh.current.rotation.x += delta * 0.003
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        sizeAttenuation
        color="#ffffff"
        transparent
        opacity={0.45}
        fog={false}
      />
    </points>
  )
}

export function R3FBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 75 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Particles />
      </Canvas>
    </div>
  )
}
```

- [x] **Write HeroSection.tsx** — added orange ambient radial glow behind TVs

```tsx
// components/hero/HeroSection.tsx
'use client'
import dynamic from 'next/dynamic'
import { PodiumTVs } from './PodiumTVs'

const R3FBackground = dynamic(
  () => import('./R3FBackground').then(m => ({ default: m.R3FBackground })),
  { ssr: false }
)

export function HeroSection() {
  return (
    <section style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      minHeight: '55vh',
      paddingTop: 52,
      background: '#07060A',
    }}>
      <R3FBackground />

      {/* Bottom fade into page background */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '40%',
        background: 'linear-gradient(transparent, #0A0A0A)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <PodiumTVs />
      </div>
    </section>
  )
}
```

- [x] **Update page.tsx to use HeroSection**

```tsx
// app/page.tsx
'use client'
import { Navbar } from '@/components/navbar/Navbar'
import { HeroSection } from '@/components/hero/HeroSection'

export default function Page() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <div style={{ height: '100vh' }} />
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add components/hero/R3FBackground.tsx components/hero/HeroSection.tsx app/page.tsx
git commit -m "feat: R3F particle background in hero section"
```

---

### Stage 5 Gate — MUST PASS BEFORE STAGE 6

```
[OK] Particles visible behind TVs, not in front
[OK] Canvas is transparent — hero background (#07060A) shows through
[OK] Particle rotation is barely perceptible (slow)
[OK] Bottom gradient fades hero smoothly into #0A0A0A — no hard line
[OK] TVs still animate on load (GSAP still works with R3F present)
[OK] No WebGL errors in console
[OK] GPU usage reasonable — not spiking above 30% on a mid-range laptop
[OK] Canvas does not block clicks (pointer-events: none works)
```

---

### Stage 5 Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| R3F Canvas renders on server | Hydration error | `dynamic(..., { ssr: false })` is required — already in HeroSection |
| Canvas sits on top of TVs | Particles occlude TV elements | Set `zIndex: 0` on canvas wrapper, `zIndex: 2` on TV container |
| Black canvas background | No transparency | `gl={{ alpha: true }}` + `style={{ background: 'transparent' }}` on Canvas |
| WebGL context lost on mobile | Black box after a few seconds | Reduce `count` to 600 on mobile via window.innerWidth check |
| GSAP animation fights R3F | TVs flicker during drop | They operate independently — no conflict. If flickering occurs, check that both run in `useEffect` not in render |

---

## Stage 6: Leaderboard Table + Pagination

**Goal:** Full-width table below hero. 20 rows per page. Page change triggers fade-out/in animation.

### Task 9: RankRow

**Files:** `components/leaderboard/RankRow.tsx`

**Aesthetic notes:**
- Row is a grid: rank number | name | points. Three columns, nothing else.
- Row height: 44px (`py-3 px-4`). Comfortable but not padded.
- Rank number in mono, padded to 2 digits (`01`, `02`). For ranks 4-200: muted white (`rgba(255,255,255,0.20)`). For top 3: orange.
- Name: 80% opacity for regular rows. Not full white — that's reserved for interactive states.
- Points: right-aligned, mono, tabular-nums. Top 3: orange. Rest: `rgba(255,255,255,0.30)`.
- Hover state: subtle `rgba(255,255,255,0.03)` background increase. Almost invisible — just enough to confirm interactivity.
- No avatars in the table rows. Those are only on the TVs.

- [x] **Write RankRow.tsx** — added orange left-border accent for top 3, hover orange border tint on pagination

```tsx
// components/leaderboard/RankRow.tsx
import type { Student } from '@/lib/types'

type Props = { student: Student; isTop3?: boolean }

export function RankRow({ student, isTop3 = false }: Props) {
  const { rank, name, points } = student

  return (
    <div
      className="grid items-center gap-3 px-4 py-3 mb-[2px] rounded-[4px] border transition-colors duration-100"
      style={{
        gridTemplateColumns: '44px 1fr auto',
        background: isTop3 ? 'rgba(249,104,70,0.03)' : 'rgba(255,255,255,0.015)',
        borderColor: isTop3 ? 'rgba(249,104,70,0.12)' : 'rgba(255,255,255,0.04)',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = isTop3
          ? 'rgba(249,104,70,0.06)'
          : 'rgba(255,255,255,0.03)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = isTop3
          ? 'rgba(249,104,70,0.03)'
          : 'rgba(255,255,255,0.015)'
      }}
    >
      <span
        className="font-mono text-sm font-bold text-center"
        style={{ color: isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.18)' }}
      >
        {String(rank).padStart(2, '0')}
      </span>

      <span
        className="text-sm font-medium"
        style={{ color: isTop3 ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.60)' }}
      >
        {name}
      </span>

      <span
        className="font-mono text-sm font-bold tabular-nums"
        style={{ color: isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.28)' }}
      >
        {points.toLocaleString()}
      </span>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add components/leaderboard/RankRow.tsx
git commit -m "feat: rank row — rank/name/points grid"
```

---

### Task 10: Pagination

**Files:** `components/leaderboard/Pagination.tsx`

**Aesthetic notes:**
- Page buttons: 32×32px. Square, not rounded (radius: 4px).
- Inactive: transparent background, `rgba(255,255,255,0.08)` border, muted text.
- Active: `#F96846` solid background, `#000` text. Single clear signal.
- Ellipsis: just a `...` text node, no button. Muted.

- [x] **Write Pagination.tsx**

```tsx
// components/leaderboard/Pagination.tsx
type Props = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 32, paddingBottom: 48 }}>
      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`e${i}`} style={{ padding: '0 8px', fontSize: 13, color: 'var(--color-text-muted)' }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            style={{
              width: 32, height: 32,
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.1s',
              background: currentPage === page ? 'var(--color-primary)' : 'transparent',
              color: currentPage === page ? '#000' : 'rgba(255,255,255,0.30)',
              border: currentPage === page ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {page}
          </button>
        )
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add components/leaderboard/Pagination.tsx
git commit -m "feat: google-style pagination"
```

---

### Task 11: RankTable + LeaderboardSection

**Files:** `components/leaderboard/RankTable.tsx`, `components/leaderboard/LeaderboardSection.tsx`

- [x] **Write RankTable.tsx**

```tsx
// components/leaderboard/RankTable.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { STUDENTS } from '@/lib/dummy-data'
import { PAGE_SIZE } from '@/lib/constants'
import { RankRow } from './RankRow'
import { Pagination } from './Pagination'

export function RankTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.ceil(STUDENTS.length / PAGE_SIZE)
  const pageStudents = STUDENTS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Initial stagger — fires after TV animation completes
  useEffect(() => {
    if (!listRef.current) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    gsap.fromTo(rows,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.28, stagger: 0.022, delay: 1.4, ease: 'power2.out' }
    )
  }, [])

  // Page change animation
  const handlePageChange = (page: number) => {
    if (!listRef.current || page === currentPage) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    gsap.to(rows, {
      opacity: 0, y: -8, duration: 0.14, ease: 'power2.in',
      onComplete: () => setCurrentPage(page),
    })
  }

  // Re-stagger on page change
  useEffect(() => {
    if (!listRef.current) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    gsap.fromTo(rows,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.22, stagger: 0.018, ease: 'power2.out' }
    )
  }, [currentPage])

  return (
    <div>
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: 12,
        padding: '0 16px 10px',
        marginBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        letterSpacing: '3px',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}>
        <span>Rank</span>
        <span>Name</span>
        <span>Points</span>
      </div>

      {/* Rows */}
      <div ref={listRef} key={currentPage}>
        {pageStudents.map(student => (
          <div key={student.id} data-row="">
            <RankRow student={student} isTop3={student.rank <= 3} />
          </div>
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  )
}
```

- [x] **Write LeaderboardSection.tsx** — added "C6 — 200" counter label on right of Rankings rule

```tsx
// components/leaderboard/LeaderboardSection.tsx
import { RankTable } from './RankTable'

export function LeaderboardSection() {
  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: '48px 16px 0' }}>
      {/* Section label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        letterSpacing: '4px',
        textTransform: 'uppercase',
        color: 'rgba(249,104,70,0.45)',
      }}>
        <span>Rankings</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <RankTable />
    </section>
  )
}
```

- [x] **Update page.tsx with leaderboard section**

```tsx
// app/page.tsx
'use client'
import { Navbar } from '@/components/navbar/Navbar'
import { HeroSection } from '@/components/hero/HeroSection'
import { LeaderboardSection } from '@/components/leaderboard/LeaderboardSection'

export default function Page() {
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <LeaderboardSection />
    </main>
  )
}
```

- [ ] **Commit**

```bash
git add components/leaderboard/RankTable.tsx components/leaderboard/LeaderboardSection.tsx app/page.tsx
git commit -m "feat: rank table with pagination and stagger animation"
```

---

### Stage 6 Gate — MUST PASS BEFORE STAGE 7

```
[OK] Exactly 20 rows on page 1
[OK] Exactly 10 pages total (200 / 20)
[OK] Page 10 has rows 181-200
[OK] Row stagger animation fires ~1.4s after page load (after TV drop)
[OK] Page change: old rows fade out, new rows stagger in
[OK] Clicking current page number does nothing (no re-animation)
[OK] Column headers align with row content
[OK] "Rankings" label with horizontal rule renders correctly
[OK] No layout shift between pages (row container height stays stable)
```

---

### Stage 6 Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| GSAP animates rows on every render | Rows animate on each keystroke/state change | The `useEffect` with `[currentPage]` dep is intentional. The initial effect `[]` fires once. Do not add other deps. |
| Page change stutter | Old rows visible while new rows fade in | `key={currentPage}` on the list div forces React to unmount/remount — GSAP fadeout completes in `onComplete` before `setCurrentPage` |
| Pagination shows wrong page count | 11 pages instead of 10 | Check `Math.ceil(200 / 20) === 10`. If STUDENTS.length is wrong, fix dummy-data generator |
| Rows jump on page change | `y: -8` out animation conflicts with incoming `y: 12` | They target different DOM nodes — old nodes fade out, new nodes (after key change) fade in. No conflict. |
| Section too wide on large screens | Table spans full viewport | `maxWidth: 640` on LeaderboardSection wrapper — already in code |

---

## Stage 7: Final Assembly + Lenis

**Goal:** Lenis smooth scroll active. Full page assembled and verified end-to-end. Final layout tweaks.

### Task 12: Lenis

**Files:** `hooks/useLenis.ts`

- [x] **Write useLenis.ts**

```ts
// hooks/useLenis.ts
'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    let rafId: number
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])
}
```

- [ ] **Commit**

```bash
git add hooks/useLenis.ts
git commit -m "feat: lenis smooth scroll"
```

---

### Task 13: Final page + layout

**Files:** `app/page.tsx`, `app/layout.tsx`

- [x] **Write final page.tsx**

```tsx
// app/page.tsx
'use client'
import { Navbar } from '@/components/navbar/Navbar'
import { HeroSection } from '@/components/hero/HeroSection'
import { LeaderboardSection } from '@/components/leaderboard/LeaderboardSection'
import { useLenis } from '@/hooks/useLenis'

export default function Page() {
  useLenis()
  return (
    <main style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <HeroSection />
      <LeaderboardSection />
    </main>
  )
}
```

- [x] **Write layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'C6 Leaderboard — 100xEngineers',
  description: 'Cohort 7 live rankings',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat: final page assembly with lenis"
```

---

### Stage 7 Gate — FULL COMPLETION CHECKLIST

Run every item before calling this done:

```
ANIMATION
[OK] #1 TV drops first (elastic), #2+#3 drop ~0.35s later
[OK] Row stagger fires after TV animation completes
[OK] Page change: old rows fade out then new rows stagger in
[OK] Lenis active — scroll feels weighted and smooth, not instant

VISUAL
[OK] Background is #0A0A0A — not white, not grey
[OK] Navbar glassmorphism visible when scrolling over content
[OK] Live dot blinks continuously
[OK] Particle field rotates barely perceptibly
[OK] Bottom gradient fades hero into page — no hard edge
[OK] Top 3 rows have orange tint + border
[OK] Active pagination button is orange on black
[OK] No orange used outside: rank#1 TV, top-3 rows, active pagination, live pill

FUNCTIONALITY
[OK] 20 rows on page 1
[OK] Exactly 10 pages for 200 students
[OK] Pagination correctly shows ellipsis on pages 4+
[OK] Column headers: Rank / Name / Points

TECHNICAL
[OK] No console errors
[OK] No hydration mismatches
[OK] npx tsc --noEmit — zero TypeScript errors
[OK] Reduced motion: animations skip when OS setting enabled
[OK] Mobile 375px: TVs fit, table readable, no horizontal scroll
```

---

### Stage 7 Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Lenis conflicts with R3F | Scroll stutters | Lenis and R3F both use `requestAnimationFrame`. They coexist fine — do not use `requestAnimationFrame` elsewhere on the page. |
| Hydration mismatch | Console: "Text content did not match" | `'use client'` missing on components that use hooks or browser APIs. R3F always needs `ssr: false`. |
| `useLenis` runs twice in dev | Double Lenis instance | React StrictMode — cleanup in `return () => { lenis.destroy() }` already handles this |
| `npx tsc` errors on Three.js types | `Cannot find type definition for 'three'` | `npm install -D @types/three` — should be installed from Stage 1 |
| Orange bleeds everywhere | Too much brand color | Review: orange should appear in exactly 5 places: live pill, #1 TV glow, top-3 row tint, active pagination, section label. Audit and reduce. |

---

## Aesthetic Final Audit

Before shipping, answer these questions honestly:

1. **Is there anything on the page that doesn't serve a function?** Remove it.
2. **Are there more than 5 uses of orange?** Reduce until there are exactly 5.
3. **Do the particles feel like they're in space, or like a screensaver?** If screensaver — slow them down or reduce opacity.
4. **Does the TV glow feel subtle or aggressive?** `box-shadow` should be barely visible. If you notice it first, it's too strong.
5. **Is the leaderboard table easy to scan in 2 seconds?** Rank → name → number. If anything interrupts that path, remove it.
6. **Does the page feel finished when the animations complete?** The final state — TVs landed, rows visible — should feel like a composed, still photograph. Nothing should still be moving except the particles and live dot.

---

## Unresolved (Phase 2+)

- Points formula (program team to provide)
- Supabase client integration — replace dummy-data with real fetch
- Edminole API — attendance + assignments
- Filters: all-time / weekly / monthly (Phase 3)
- Track filter (Phase 3)
- Student photo source — Supabase storage or external URL
- Vision 2 (user to define)
