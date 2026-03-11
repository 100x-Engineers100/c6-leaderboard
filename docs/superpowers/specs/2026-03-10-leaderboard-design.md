# C6 Leaderboard — Design Spec
Date: 2026-03-10
Status: Approved
--------
❯ ❯ Hey now i ahve a detailed doc fro making this project, @docs\superpowers\plans\frontend-leaderboard.md  now start with each stage and test it , if u need nay 
  clarity on any thing, do not assume ask in between, use the master ui prompt and master software dev prompt to start the devlopent. make it abstract. afer       
  ecah stage completion updat ethe doc with the progress and ask fo rmy approval of movinf to teh next stage.   
---

## 1. Project Overview

**What:** Single-page public leaderboard for 100xEngineers Cohort 6 (C6).
**Why:** Gamify the cohort experience by ranking ~200-300 students on total points earned across UGC content, attendance, and assignment submissions.
**Who:** Public — anyone can view, no login required.

---

## 2. Data Sources (Backend — Phase 2, not v1)

Three data inputs feed total points:

| Source | API / DB | Status |
|---|---|---|
| UGC Content | Supabase (existing pipeline) | Pipeline built, DB ready |
| Attendance | Edminole LMS API | Pending integration |
| Assignment Submissions | Edminole LMS API | Pending integration |

**Edminole API Docs:** https://documenter.getpostman.com/view/11192156/UzQvsQWi#4e081243-f718-4abd-811f-2dcc7fdadbba

**UGC:** LinkedIn posts with `#100xengineers` hashtag. Points assigned per formula (TBD — program team to provide).
**Attendance:** Points per class attended. Bonus for streaks (TBD).
**Assignments:** Points per submission, weighted by score (TBD).

**v1 uses dummy data only.** Real formula + API integration in Phase 2.

---

## 3. Table Schema (v1 Dummy)

```ts
type Student = {
  rank: number
  name: string
  points: number
  avatar?: string   // profile photo URL — shown in pixel art TV for top 3
}
```

Leaderboard table columns: **Rank | Name | Points**

---

## 4. Page Layout

```
┌─────────────────────────────────────────┐
│  NAV: 100xEngineers logo    C6 Live pill│  glassmorphism, fixed
├─────────────────────────────────────────┤
│                                         │
│   [R3F particle background]             │
│                                         │  TOP 1/3
│   ┌──────┐   ┌──────┐   ┌──────┐      │  3 pixel art TVs
│   │ TV2  │   │ TV1  │   │ TV3  │      │  fall in on page load
│   │ #2   │   │ #1   │   │ #3   │      │  via GSAP
│   └──────┘   └──────┘   └──────┘      │
│                                         │
├─────────────────────────────────────────┤
│  RANK  NAME              POINTS         │
│  ─────────────────────────────────      │  BOTTOM 2/3
│  01    Arjun Kapoor      9,842          │  flat list, top 20
│  02    Sneha Rathi       8,110          │
│  ...                                    │
│  [  1  2  3  4  5  ]                   │  pagination
└─────────────────────────────────────────┘
```

**Podium order:** #2 left · #1 center (largest) · #3 right
**Pagination:** Google-style page numbers, 20 students per page
**Future filters (Phase 3):** All-time / Weekly / Monthly · Track filter

---

## 5. Component Tree

```
<LeaderboardPage>
  ├── <Navbar>                    fixed, glassmorphism
  ├── <HeroSection>
  │   ├── <R3FBackground>         particle canvas, z-index 0
  │   └── <PodiumTVs>
  │       ├── <PixelTV rank={2}>  left, smaller
  │       ├── <PixelTV rank={1}>  center, largest, orange glow
  │       └── <PixelTV rank={3}>  right, smaller
  └── <LeaderboardSection>
      ├── <RankTable>             rows for current page
      └── <Pagination>           page number controls
```

---

## 6. Animation Plan (GSAP)

```
Page load sequence:
0ms    R3F background fades in           (600ms, opacity 0->1)
400ms  #1 TV drops from above header     (700ms, y:-200->0, elastic ease)
700ms  #2 + #3 TVs drop simultaneously  (700ms, y:-200->0, elastic ease)
1200ms Table rows stagger in             (30ms per row, y:20->0 + fade)
       Pagination fades in               (after last row)
```

**Lenis:** wraps full page for smooth scroll.
**No scroll-triggered animations in v1** — all animations are load-time only.

---

## 7. PixelTV Component

- CSS pixel art CRT television silhouette
- Student photo inside screen (circular crop, scanline overlay via CSS `repeating-linear-gradient`)
- Rank badge below TV (`#1`, `#2`, `#3`) in `JetBrains Mono`
- Name + points score below badge
- Screen glow: `#F96846` for #1 · muted amber for #2 · muted grey for #3
- TV sizes: #1 = 1.3x scale, #2 and #3 = 1x scale

---

## 8. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Team already uses it (Community Events) |
| 3D / particles | Three.js + React Three Fiber (R3F) | Background particle field only |
| Animation | GSAP + @gsap/react | TV drop + row stagger |
| Smooth scroll | Lenis | Essential for Shopify-feel scroll |
| UI animations | Rive (optional) | Rank badge micro-animations |
| Styling | Tailwind CSS | Already in project |
| Data (v1) | Static dummy JSON | No backend in v1 |
| Data (v2) | Supabase client | UGC pipeline already there |
| Deploy | Vercel | Same as Community Events |

---

## 9. Design System

> **The Prompt**
> You are building a leaderboard app with a dark editorial, Shopify-inspired visual identity with pixel art accent elements.
> _(Full brand context to be added here by program team)_

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#FF6B35` | Main actions, active rank highlights |
| Secondary | `#F96846` | Borders, glows, hover states |
| Background | `#0A0A0A` | Main canvas |
| Surface | `#141414` | Cards, table rows |
| Surface Elevated | `#1A1A1A` | Modals, dropdowns |
| Text Primary | `#FFFFFF` | Headings, names |
| Text Secondary | `#A0A0A0` | Captions, sub-labels |
| Text Muted | `#666666` | Placeholders, inactive pagination |
| Border | `#2A2A2A` | Dividers, input outlines |
| Border Accent | `#F96846` | Focused / active borders |
| Success | `#22C55E` | — |
| Warning | `#EAB308` | — |
| Error | `#EF4444` | — |

**Rule: Never introduce colors outside this palette.**

### Typography

| Role | Font | Weight |
|---|---|---|
| Headings, body, UI | Space Grotesk | 300 / 400 / 500 / 600 / 700 |
| Rank numbers, points, mono labels | JetBrains Mono | 400 / 700 |

**Size Scale:** 12 / 14 / 16 / 20 / 24 / 32 / 40 / 48px
**Headings:** bold, tracking tight
**Body:** regular weight

### Spacing Scale

4px base unit. Values: **4, 8, 12, 16, 24, 32, 48, 64px**
**Rule: Always use the spacing scale — no arbitrary values.**

### Border Radius

| Context | Value |
|---|---|
| Small (chips, badges, inputs) | 4px |
| Medium (cards, buttons, TVs) | 8px |
| Large (modals, containers) | 16px |
| Full (avatars, pills) | 9999px |

**Rule: Maintain consistent border radius per element type.**

### Glassmorphism (Navbar + elevated surfaces)

```css
background:      rgba(255, 255, 255, 0.06);
backdrop-filter: blur(24px) saturate(120%);
border:          1px solid rgba(255, 255, 255, 0.08);
box-shadow:      0 8px 32px rgba(0,0,0,0.3),
                 inset 0 1px 0 rgba(255,255,255,0.06);
```

### Shadows

| Level | Value |
|---|---|
| Subtle | `0 1px 2px rgba(0,0,0,0.05)` |
| Medium | `0 4px 12px rgba(0,0,0,0.1)` |
| Strong | `0 8px 24px rgba(0,0,0,0.15)` |
| Glow (orange) | `0 0 24px rgba(249,104,70,0.25)` |

### Component Patterns

**Buttons:** height 40px, padding 0 16px, border-radius 8px, hover: opacity 0.85 + slight scale(1.02)
**Inputs:** height 40px, padding 0 12px, border-radius 4px, focus: border-color #F96846 + glow shadow
**Cards:** padding 16px, border-radius 8px, border 1px solid #2A2A2A, background #141414
**Pills/Badges:** padding 4px 12px, border-radius 9999px, font-size 12px, letter-spacing 2px

**Rule: When in doubt, add more whitespace.**

---

## 10. Future Roadmap (Not v1)

| Phase | Feature |
|---|---|
| Phase 2 | Supabase integration — real student data |
| Phase 2 | Edminole API — attendance + assignments |
| Phase 2 | Points formula implementation (program team to provide) |
| Phase 3 | Filters: All-time / Weekly / Monthly |
| Phase 3 | Track filter |
| Phase 3 | Individual student profile modal (click a row) |
| Vision 2 | TBD (user to define) |

---

## 11. Unresolved Questions

- Points formula for UGC, attendance, and assignments (program team)
- Edminole API credentials / auth method
- Does the R3F background use a specific particle style or is it developer's choice?
- Pixel art TV design — specific reference image or developer's interpretation?
- Student photo source — does Supabase store photos or will they be sourced separately?
