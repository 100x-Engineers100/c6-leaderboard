'use client'
import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { Student } from '@/lib/types'
import { PAGE_SIZE } from '@/lib/constants'
import { RankRow } from './RankRow'
import { Pagination } from './Pagination'

type Props = {
  students: Student[]
  loading:  boolean
}

export function RankTable({ students, loading }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)
  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const pageStudents = students.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Initial stagger — fires once after TV drop completes
  useEffect(() => {
    if (!listRef.current) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    gsap.fromTo(rows,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.28, stagger: 0.022, delay: 1.6, ease: 'power2.out' }
    )
  }, [])

  // Page change — fade out current, set new page, fade in
  const handlePageChange = (page: number) => {
    if (!listRef.current || page === currentPage) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    gsap.to(rows, {
      opacity: 0,
      y: -8,
      duration: 0.14,
      ease: 'power2.in',
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

  // Reset to page 1 when new data loads
  useEffect(() => {
    setCurrentPage(1)
  }, [students])

  return (
    <div>
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 80px 80px 80px 80px',
        gap: 12,
        padding: '0 16px 10px',
        marginBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        fontWeight: 2000,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}>
        <span>#</span>
        <span>Builder</span>
        <span style={{ textAlign: 'right' }}>Attendance</span>
        <span style={{ textAlign: 'right' }}>Projects</span>
        <span style={{ textAlign: 'right' }}>#0to100x</span>
        <span style={{ textAlign: 'right' }}>Total XP</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: '48px 16px',
          textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '2px',
        }}>
          Loading...
        </div>
      )}

      {/* Rows */}
      {!loading && (
        <>
          <div ref={listRef} key={currentPage}>
            {pageStudents.map(student => (
              <div key={student.id} data-row="">
                <RankRow student={student} isTop3={student.rank <= 3} />
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalStudents={students.length}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}
