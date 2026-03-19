import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      name,
      email,
      avatar_url,
      student_points (
        attendance_pts,
        ugc_post_pts,
        consistency_bonus_pts,
        assignment_pts,
        hackathon_pts,
        capstone_pts,
        total_points,
        last_synced_at
      )
    `)
    .eq('cohort', 'C7')
    .order('total_points', { ascending: false, referencedTable: 'student_points' })

  if (error) {
    console.error('[ERROR] leaderboard fetch:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch individual event scores
  const { data: uploads } = await supabase
    .from('score_uploads')
    .select('student_id, event_type, points')

  // Build map: studentId -> { event_type: points }
  type ScoreMap = Record<string, Record<string, number>>
  const scoreMap: ScoreMap = {}
  for (const row of uploads ?? []) {
    if (!scoreMap[row.student_id]) scoreMap[row.student_id] = {}
    scoreMap[row.student_id][row.event_type] = row.points
  }

  // Flatten + assign rank
  const students = (data ?? [])
    .map((s, i) => {
      const pts = Array.isArray(s.student_points) ? s.student_points[0] : s.student_points
      const ev = scoreMap[s.id] ?? {}
      return {
        id:                   s.id,
        rank:                 i + 1,
        name:                 s.name,
        avatar:               s.avatar_url ?? null,
        total_points:         pts?.total_points         ?? 0,
        attendance_pts:       pts?.attendance_pts       ?? 0,
        ugc_post_pts:         pts?.ugc_post_pts         ?? 0,
        consistency_bonus_pts: pts?.consistency_bonus_pts ?? 0,
        assignment_pts:       pts?.assignment_pts       ?? 0,
        hackathon_pts:        pts?.hackathon_pts        ?? 0,
        capstone_pts:         pts?.capstone_pts         ?? 0,
        assignment_1_pts:   ev['assignment_1']   ?? 0,
        assignment_2_pts:   ev['assignment_2']   ?? 0,
        assignment_3_pts:   ev['assignment_3']   ?? 0,
        assignment_4_pts:   ev['assignment_4']   ?? 0,
        midcapstone_pts:    ev['midcapstone']    ?? 0,
        final_capstone_pts: ev['final_capstone'] ?? 0,
      }
    })
    // Secondary sort: alphabetical by name for ties
    .sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points
      return a.name.localeCompare(b.name)
    })
    .map((s, i) => ({ ...s, rank: i + 1 }))

  return NextResponse.json(students, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
