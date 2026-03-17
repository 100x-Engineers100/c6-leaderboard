// This file is kept as a dev fallback only.
// Production data comes from /api/leaderboard.
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
      id:                   `student-${i + 1}`,
      rank:                 i + 1,
      name:                 suffix === 0 ? baseName : `${baseName} ${suffix + 1}`,
      total_points:         Math.max(100, 10000 - i * 48),
      attendance_pts:       Math.floor(Math.random() * 200),
      ugc_post_pts:         Math.floor(Math.random() * 100),
      consistency_bonus_pts: Math.floor(Math.random() * 50),
      assignment_pts:       0,
      hackathon_pts:        0,
      capstone_pts:         0,
    })
  }
  return students
}

export const FALLBACK_STUDENTS: Student[] = generateStudents()

export const FALLBACK_TOP_3: Student[] = [
  { ...FALLBACK_STUDENTS[0], avatar: '/avatar_demo.jpeg' },
  { ...FALLBACK_STUDENTS[1], avatar: '/avatar_rank2.jpeg' },
  { ...FALLBACK_STUDENTS[2], avatar: '/avatar_rank3.jpeg' },
]
