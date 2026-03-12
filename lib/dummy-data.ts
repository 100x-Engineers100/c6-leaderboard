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
      points: Math.max(100, 10000 - i * 48),
    })
  }
  return students
}

export const STUDENTS: Student[] = generateStudents()

// Override top 3 with demo avatars
const top3Raw = STUDENTS.slice(0, 3)
export const TOP_3: Student[] = [
  { ...top3Raw[0], avatar: '/avatar_demo.jpeg' },
  { ...top3Raw[1], avatar: '/avatar_rank2.jpeg' },
  { ...top3Raw[2], avatar: '/avatar_rank3.jpeg' },
]
