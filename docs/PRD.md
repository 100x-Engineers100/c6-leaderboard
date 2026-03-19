# Product Requirements Document
## 100xEngineers C6 Leaderboard

**Version:** 1.0
**Date:** 2026-03-10
**Status:** Approved for development


 Plan to implement                                                                                                                                                    ││                                                                                                                                                                      ││ Plan: Manual Score Upload System (5 Metrics)                                                                                                                         ││                                                                                                                                                                      │
│ Context                                                                                                                                                              │
│                                                                                                                                                                      │
│ Attendance + UGC are automated. Need to add 5 manual metrics: 4 assignments, mid capstone, mini hackathon, final capstone. Admin uploads CSVs through a 7-channel    │
│ admin panel. Points upserted per student per event — no duplication guaranteed via UNIQUE(student_id, event_type). Weekly consistency bonus already automated via    │
│ UGC sync, no new work needed.                                                                                                                                        │
│                                                                                                                                                                      │
│ ---                                                                                                                                                                  │
│ Stage 1: DB Schema Additions                                                                                                                                         │
│                                                                                                                                                                      │
│ New table: score_uploads                                                                                                                                             │
│ CREATE TABLE score_uploads (                                                                                                                                         │
│   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                                     │
│   student_id UUID REFERENCES students(id),                                                                                                                           │
│   event_type VARCHAR NOT NULL,  -- 'assignment_1'..'assignment_4', 'midcapstone', 'hackathon_1', 'final_capstone'                                                    │
│   points INT NOT NULL DEFAULT 0,                                                                                                                                     │
│   raw_score INT,                -- original marks from CSV (for audit)                                                                                               │
│   created_at TIMESTAMP DEFAULT now(),                                                                                                                                │
│   updated_at TIMESTAMP DEFAULT now(),                                                                                                                                │
│   UNIQUE(student_id, event_type)  -- dedup guarantee                                                                                                                 │
│ );                                                                                                                                                                   │
│                                                                                                                                                                      │
│ New table: score_upload_batches (audit log)                                                                                                                          │
│ CREATE TABLE score_upload_batches (                                                                                                                                  │
│   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),                                                                                                                     │
│   event_type VARCHAR NOT NULL,                                                                                                                                       │
│   row_count INT,                                                                                                                                                     │
│   uploaded_at TIMESTAMP DEFAULT now()                                                                                                                                │
│ );                                                                                                                                                                   │
│                                                                                                                                                                      │
│ No changes to student_points — existing columns assignment_pts, hackathon_pts, capstone_pts stay. We update them by summing score_uploads after each upload.         │
│                                                                                                                                                                      │
│ Event → column mapping:                                                                                                                                              │
│ - assignment_1..4 → assignment_pts (sum of all 4)                                                                                                                    │
│ - hackathon_1 → hackathon_pts                                                                                                                                        │
│ - midcapstone + final_capstone → capstone_pts (sum of both)                                                                                                          │
│                                                                                                                                                                      │
│ Test Stage 1: Run migration SQL in Supabase, verify tables created, verify UNIQUE constraint works by inserting duplicate and confirming upsert.                     │
│                                                                                                                                                                      │
│ ---                                                                                                                                                                  │
│ Stage 2: Score Processing Utilities                                                                                                                                  │
│                                                                                                                                                                      │
│ File: scripts/process-score-upload.mjs                                                                                                                               │
│                                                                                                                                                                      │
│ Reuse the CSV parser already in seed-students.mjs (handles quoted fields, embedded newlines, Windows/Unix endings).                                                  │
│                                                                                                                                                                      │
│ Per-event point calculation logic:                                                                                                                                   │
│                                                                                                                                                                      │
│ ┌─────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────┐                                         │
│ │      Event      │                                                 Logic                                                  │                                         │
│ ├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤                                         │
│ │ assignment_1..4 │ Group by email → filter EVALUATED rows → take max marks_obtained → points = max marks                  │                                         │
│ ├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤                                         │
│ │ midcapstone     │ Group by email → base 30 (anyone in sheet) + max marks_obtained among EVALUATED rows → total out of 50 │                                         │
│ ├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤                                         │
│ │ hackathon_1     │ Group by email → take max "Total Points(100)" column → points = that value                             │                                         │
│ ├─────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┤                                         │
│ │ final_capstone  │ Anyone in right-side "Mail" column where status = "Submitted" → 200 points flat                        │                                         │
│ └─────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────┘                                         │
│                                                                                                                                                                      │
│ CSV column mappings:                                                                                                                                                 │
│ - Assignment/MidCapstone (Edmingle export): col[2]=Email, col[5]=EvaluationStatus, col[8]=MarksObtained                                                              │
│ - Hackathon: col[1]=Email, col[14]=TotalPoints                                                                                                                       │
│ - Final Capstone: col[12]=Email (right-side), col[13]="Submitted" indicator                                                                                          │
│                                                                                                                                                                      │
│ After upsert → recalculate student_points:                                                                                                                           │
│ // for each affected student:                                                                                                                                        │
│ const sums = await db.from('score_uploads')                                                                                                                          │
│   .select('event_type, points')                                                                                                                                      │
│   .eq('student_id', studentId)                                                                                                                                       │
│                                                                                                                                                                      │
│ const assignment_pts = sum where event_type LIKE 'assignment_%'                                                                                                      │
│ const hackathon_pts = sum where event_type = 'hackathon_1'                                                                                                           │
│ const capstone_pts = sum where event_type IN ('midcapstone', 'final_capstone')                                                                                       │
│                                                                                                                                                                      │
│ // UPDATE student_points SET assignment_pts=..., hackathon_pts=..., capstone_pts=...                                                                                 │
│                                                                                                                                                                      │
│ Test Stage 2: Run script manually with each sample CSV from docs/. Verify:                                                                                           │
│ - Duplicates → highest score wins                                                                                                                                    │
│ - midcapstone NOT_EVALUATED student → gets 30, not 30+0                                                                                                              │
│ - final_capstone → exactly 200 per submitter                                                                                                                         │
│ - Confirm student_points totals updated correctly in DB                                                                                                              │
│                                                                                                                                                                      │
│ ---                                                                                                                                                                  │
│ Stage 3: Admin API Route                                                                                                                                             │
│                                                                                                                                                                      │
│ File: app/api/admin/upload/[event_type]/route.ts                                                                                                                     │
│                                                                                                                                                                      │
│ POST /api/admin/upload/assignment_1                                                                                                                                  │
│ POST /api/admin/upload/midcapstone                                                                                                                                   │
│ POST /api/admin/upload/hackathon_1                                                                                                                                   │
│ POST /api/admin/upload/final_capstone                                                                                                                                │
│ ...                                                                                                                                                                  │
│                                                                                                                                                                      │
│ Request: multipart/form-data with file (CSV) + preview boolean flag                                                                                                  │
│                                                                                                                                                                      │
│ Response (preview=true): Returns parsed data — student list + calculated points — no DB write                                                                        │
│ {                                                                                                                                                                    │
│   "preview": true,                                                                                                                                                   │
│   "event_type": "assignment_1",                                                                                                                                      │
│   "students": [{ "email": "x", "name": "x", "points": 16, "raw_score": 16 }],                                                                                        │
│   "total_students": 47,                                                                                                                                              │
│   "unmatched_emails": ["unknown@email.com"]                                                                                                                          │
│ }                                                                                                                                                                    │
│                                                                                                                                                                      │
│ Response (preview=false): Writes to DB, logs batch, returns summary                                                                                                  │
│ {                                                                                                                                                                    │
│   "upserted": 44,                                                                                                                                                    │
│   "unmatched": 3,                                                                                                                                                    │
│   "batch_id": "uuid"                                                                                                                                                 │
│ }                                                                                                                                                                    │
│                                                                                                                                                                      │
│ Validation: Reject unknown event_type values. Return 400 with message.                                                                                               │
│                                                                                                                                                                      │
│ File: lib/event-config.ts — single source of truth for valid event types and their metadata.                                                                         │
│                                                                                                                                                                      │
│ Test Stage 3: Use curl/Postman to POST sample CSVs. Verify preview returns correct calculated points. Verify commit writes to score_uploads and updates              │
│ student_points. Verify duplicate upload (same student, same event) updates not duplicates.                                                                           │
│                                                                                                                                                                      │
│ ---                                                                                                                                                                  │
│ Stage 4: Admin UI                                                                                                                                                    │
│                                                                                                                                                                      │
│ File: app/admin/page.tsx                                                                                                                                             │
│                                                                                                                                                                      │
│ No auth for now (deferred).                                                                                                                                          │
│                                                                                                                                                                      │
│ Layout: 7 tabs across top. Each tab:                                                                                                                                 │
│ 1. File input (CSV drag + drop or click)                                                                                                                             │
│ 2. Preview table (shows after file selected — auto-preview before user commits)                                                                                      │
│ 3. "Upload & Save" button (triggers commit)                                                                                                                          │
│ 4. Last upload info (batch timestamp + row count from score_upload_batches)                                                                                          │
│                                                                                                                                                                      │
│ Tab names:                                                                                                                                                           │
│ - Assignment 1 | Assignment 2 | Assignment 3 | Assignment 4                                                                                                          │
│ - Mid Capstone | Mini Hackathon | Final Capstone                                                                                                                     │
│                                                                                                                                                                      │
│ State flow per tab:                                                                                                                                                  │
│ idle → file selected → preview loading → preview shown → user confirms → uploading → success/error                                                                   │
│                                                                                                                                                                      │
│ Test Stage 4: Upload each sample CSV through UI. Verify preview shows correct data. Verify confirm updates leaderboard. Verify uploading same file again doesn't     │
│ double-count. Check score_upload_batches logs entry.                                                                                                                 │
│                                                                                                                                                                      │
│ ---                                                                                                                                                                  │
│ Critical Files                                                                                                                                                       │
│                                                                                                                                                                      │
│ ┌────────────────────────────────────────────┬────────────────────────────────────────────────┐                                                                      │
│ │                    File                    │                     Action                     │                                                                      │
│ ├────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                      │
│ │ scripts/schema.sql                         │ Add 2 new table definitions                    │                                                                      │
│ ├────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                      │
│ │ scripts/seed-students.mjs                  │ Reuse CSV parser (copy function, don't modify) │                                                                      │
│ ├────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                      │
│ │ scripts/process-score-upload.mjs           │ New — core processing logic                    │                                                                      │
│ ├────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                      │
│ │ app/api/admin/upload/[event_type]/route.ts │ New — API handler                              │                                                                      │
│ ├────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                      │
│ │ lib/event-config.ts                        │ New — event type config                        │                                                                      │
│ ├────────────────────────────────────────────┼────────────────────────────────────────────────┤                                                                      │
│ │ app/admin/page.tsx                         │ New — admin UI                                 │                                                                      │
│ └────────────────────────────────────────────┴────────────────────────────────────────────────┘                                                                      │
│                                                                                                                                                                      │
│ ---                                                                                                                                                                  │
│ Unresolved Questions                                                                                                                                                 │
│                                                                                                                                                                      │
│ - Final capstone CSV format for C7 may differ from the C5 sample. Admin will need to confirm column structure when first sheet arrives.                              │
│ - No auth on /admin for now — acceptable risk since not public-facing yet?                       
---

## 1. Problem Statement

The 100xEngineers program team has no visual, public-facing way to display cohort rankings. Students lack motivation feedback loops between sessions. There is no gamification layer surfacing effort (UGC, attendance, assignments) as a unified score.

---

## 2. Product Summary

A single-page public leaderboard for Cohort 7 (C6) that ranks ~200-300 students by total earned points. Points are calculated from three inputs: LinkedIn UGC content, class attendance, and assignment submissions. The page is visually high-quality — pixel art TV podium for top 3, ranked list below, GSAP animations, Shopify-inspired editorial aesthetic.

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


