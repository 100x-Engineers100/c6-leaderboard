# Product Requirements Document
## 100xEngineers C6 Leaderboard

**Version:** 1.0
**Date:** 2026-03-10
**Status:** Approved for development

---

## 1. Problem Statement

The 100xEngineers program team has no visual, public-facing way to display cohort rankings. Students lack motivation feedback loops between sessions. There is no gamification layer surfacing effort (UGC, attendance, assignments) as a unified score.

---

## 2. Product Summary

A single-page public leaderboard for Cohort 6 (C6) that ranks ~200-300 students by total earned points. Points are calculated from three inputs: LinkedIn UGC content, class attendance, and assignment submissions. The page is visually high-quality — pixel art TV podium for top 3, ranked list below, GSAP animations, Shopify-inspired editorial aesthetic.

---

## 3. Users

| User | Need |
|---|---|
| Cohort students | See their rank and points relative to peers |
| Program team | Motivate participation via public visibility |
| Public | View cohort performance (no login required) |

---

## 4. Functional Requirements

### 4.1 Podium (Top 3)
- Display top 3 students in pixel art CRT TV components
- Layout: #2 left · #1 center (largest) · #3 right
- Each TV shows: student photo (fallback: initials), rank badge, name, total points
- TVs animate in on page load via GSAP elastic drop (#1 first, #2+#3 together)

### 4.2 Leaderboard Table
- Columns: Rank | Name | Points
- Display 20 students per page
- Google-style pagination (page numbers, ellipsis, 10 pages for 200 students)
- Top 3 rows visually differentiated (orange tint + border)
- Page change triggers row fade-out/stagger-in animation

### 4.3 Navigation
- Fixed glassmorphism navbar
- Brand name (100xEngineers) + live status pill ("C6 Live")

### 4.4 Background
- R3F (Three.js) particle field in hero section
- Slow rotation, white particles, transparent canvas
- Gradient fade at bottom of hero into page background

### 4.5 Scroll
- Lenis smooth scroll across full page

---

## 5. Non-Functional Requirements

- **Public access:** No authentication, no login
- **Performance:** Page load < 3s on mid-range device; GPU usage < 30%
- **Accessibility:** Reduced motion supported (`prefers-reduced-motion`)
- **Responsive:** Works on 375px mobile and up
- **No backend in v1:** All data from static dummy JSON

---

## 6. Points System (Phase 2)

Three data sources feed total points:

| Source | Input | API/DB |
|---|---|---|
| UGC Content | LinkedIn posts with `#100xengineers` | Supabase (pipeline exists) |
| Attendance | Classes attended | Edminole LMS API |
| Assignments | Submissions + score | Edminole LMS API |

**Formula:** TBD — program team to provide weightings.
**Edminole API docs:** https://documenter.getpostman.com/view/11192156/UzQvsQWi

---

## 7. Design System

| Token | Value |
|---|---|
| Background | `#0A0A0A` |
| Surface | `#141414` |
| Primary accent | `#FF6B35` / `#F96846` |
| Text primary | `#FFFFFF` |
| Text secondary | `#A0A0A0` |
| Font (UI) | Space Grotesk |
| Font (numbers) | JetBrains Mono |
| Glassmorphism | `blur(24px) saturate(120%)` + `rgba(255,255,255,0.06)` bg |

---

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| 3D / particles | Three.js + React Three Fiber |
| Animation | GSAP |
| Smooth scroll | Lenis |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Data (v1) | Static dummy JSON |
| Data (v2) | Supabase |
| Deploy | Vercel |

---

## 9. Phases

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Full frontend UI, dummy data, all animations | Planned |
| **Phase 2** | Supabase + Edminole API integration, real data, points formula | Backlog |
| **Phase 3** | Filters (all-time/weekly/monthly), track filter | Backlog |
| **Vision 2** | TBD by user | Future |

---

## 10. Out of Scope (v1)

- User authentication / login
- Admin dashboard for program team
- Individual student profile pages
- Real-time websocket updates
- Points formula UI or explanation
- Mobile app

---

## 11. Success Metrics

- Page loads and animates correctly on first visit
- All 200 students accessible via pagination
- Top 3 podium renders with correct ranking
- Program team can update data by replacing dummy JSON (Phase 1) or via Supabase (Phase 2)

---

## 12. Open Questions

1. Points formula weightings (UGC vs attendance vs assignments) — program team
2. Edminole API auth credentials
3. Student photo source (Supabase storage or external?)
4. Vision 2 definition
