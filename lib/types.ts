export type Student = {
  id: string
  rank: number
  name: string
  avatar?: string | null
  // points breakdown
  total_points:          number
  attendance_pts:        number
  ugc_post_pts:          number
  consistency_bonus_pts: number
  assignment_pts:        number
  hackathon_pts:         number
  capstone_pts:          number
}
