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

  // Flatten + assign rank
  const students = (data ?? [])
    .map((s, i) => {
      const pts = Array.isArray(s.student_points) ? s.student_points[0] : s.student_points
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
