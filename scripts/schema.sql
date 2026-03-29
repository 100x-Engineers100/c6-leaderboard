-- Run this in Supabase SQL editor for the Leaderboard project
-- Migration: Add score_uploads and score_upload_batches tables
-- Run the block at the bottom of this file after the original tables

-- Students roster
CREATE TABLE IF NOT EXISTS students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR NOT NULL,
  email           VARCHAR UNIQUE NOT NULL,
  avatar_url      VARCHAR,
  edmingle_id     VARCHAR,
  ugc_user_id     VARCHAR,
  cohort          VARCHAR DEFAULT 'C7',
  created_at      TIMESTAMP DEFAULT now()
);

-- Points per student
CREATE TABLE IF NOT EXISTS student_points (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID REFERENCES students(id) UNIQUE NOT NULL,
  attendance_pts        INT DEFAULT 0,
  ugc_post_pts          INT DEFAULT 0,
  consistency_bonus_pts INT DEFAULT 0,
  assignment_pts        INT DEFAULT 0,
  hackathon_pts         INT DEFAULT 0,
  capstone_pts          INT DEFAULT 0,
  total_points          INT GENERATED ALWAYS AS (
                          attendance_pts + ugc_post_pts + consistency_bonus_pts +
                          assignment_pts + hackathon_pts + capstone_pts
                        ) STORED,
  last_synced_at        TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT now()
);

-- Raw attendance records (dedup + audit)
CREATE TABLE IF NOT EXISTS attendance_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID REFERENCES students(id),
  edmingle_student_id VARCHAR,
  session_date        DATE NOT NULL,
  session_name        VARCHAR,
  is_present          BOOLEAN NOT NULL,
  created_at          TIMESTAMP DEFAULT now(),
  UNIQUE (student_id, session_date)
);

-- UGC posts cache (dedup + audit)
CREATE TABLE IF NOT EXISTS ugc_posts_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES students(id),
  post_url     VARCHAR UNIQUE NOT NULL,
  num_likes    INT DEFAULT 0,
  num_comments INT DEFAULT 0,
  posted_at    TIMESTAMP,
  platform     VARCHAR DEFAULT 'LINKEDIN',
  synced_at    TIMESTAMP DEFAULT now()
);

-- Manual score uploads: assignments, capstone, hackathon
-- event_type values: assignment_1..4, midcapstone, hackathon_1, final_capstone
CREATE TABLE IF NOT EXISTS score_uploads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES students(id),
  event_type  VARCHAR NOT NULL,
  points      INT NOT NULL DEFAULT 0,
  raw_score   INT,
  created_at  TIMESTAMP DEFAULT now(),
  updated_at  TIMESTAMP DEFAULT now(),
  UNIQUE(student_id, event_type)
);

-- Audit log for each CSV upload batch
CREATE TABLE IF NOT EXISTS score_upload_batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR NOT NULL,
  row_count   INT,
  upserted    INT,
  unmatched   INT,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Weekly attendance log: one row per student per week, Fri/Sat sessions only.
-- attendance_pts in student_points = SUM(pts_awarded) across all rows here.
-- Idempotent: re-running the same week safely overwrites (attendance is final).
CREATE TABLE IF NOT EXISTS weekly_attendance_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID REFERENCES students(id) ON DELETE CASCADE,
  week_start       DATE NOT NULL,       -- Sunday that opened the week (YYYY-MM-DD)
  weekend_sessions INT NOT NULL DEFAULT 0,  -- 0, 1, or 2 (Fri + Sat)
  pts_awarded      INT NOT NULL DEFAULT 0,  -- weekend_sessions * 20
  synced_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, week_start)
);
