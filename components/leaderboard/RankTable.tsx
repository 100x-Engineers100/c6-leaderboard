'use client'
import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { Student } from '@/lib/types'
import { PAGE_SIZE } from '@/lib/constants'
import { RankRow } from './RankRow'
import { Pagination } from './Pagination'

type Props = {
  students: Student[]
  loading: boolean
}

export function RankTable({ students, loading }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const [query, setQuery] = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const pageStudents = students.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const matches = query.trim().length >= 1
    ? students.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  // Initial stagger
  useEffect(() => {
    if (!listRef.current) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    gsap.fromTo(rows,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.28, stagger: 0.022, delay: 1.6, ease: 'power2.out' }
    )
  }, [])

  // Page change fade-out
  const handlePageChange = (page: number) => {
    if (!listRef.current || page === currentPage) return
    const rows = listRef.current.querySelectorAll('[data-row]')
    gsap.to(rows, {
      opacity: 0, y: -8, duration: 0.14, ease: 'power2.in',
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
  useEffect(() => { setCurrentPage(1) }, [students])

  const jumpTo = (student: Student) => {
    const idx = students.findIndex(s => s.id === student.id)
    const page = Math.floor(idx / PAGE_SIZE) + 1
    setCurrentPage(page)
    setQuery(student.name)
    setDropOpen(false)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    setHighlightId(student.id)
    highlightTimer.current = setTimeout(() => setHighlightId(null), 2500)
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${query.length > 0 ? 'rgba(249,104,70,0.35)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 4,
          padding: '8px 12px',
          transition: 'border-color 0.2s ease',
        }}>
          {/* Search icon */}
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, opacity: 0.40 }}>
            <circle cx="5.5" cy="5.5" r="4.5" stroke="#F96846" strokeWidth="1.2" />
            <line x1="9" y1="9" x2="12" y2="12" stroke="#F96846" strokeWidth="1.2" strokeLinecap="round" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setDropOpen(true) }}
            onFocus={() => query.length > 0 && setDropOpen(true)}
            onBlur={() => setTimeout(() => setDropOpen(false), 150)}
            placeholder="Search builders..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.5px',
            }}
          />

          {/* Clear button */}
          {query.length > 0 && (
            <button
              onClick={() => { setQuery(''); setDropOpen(false); setHighlightId(null); inputRef.current?.focus() }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.30)', fontSize: 14, lineHeight: 1,
                padding: 0, flexShrink: 0,
              }}
            >
              x
            </button>
          )}
        </div>

        {/* Dropdown */}
        {dropOpen && matches.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'rgba(12,11,16,0.97)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.60)',
          }}>
            {matches.map((s, i) => (
              <div
                key={s.id}
                onMouseDown={() => jumpTo(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: i < matches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,104,70,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.80)',
                }}>
                  {s.name}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  color: 'rgba(249,104,70,0.70)',
                  letterSpacing: '1px',
                }}>
                  #{s.rank}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {dropOpen && query.trim().length >= 1 && matches.length === 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'rgba(12,11,16,0.97)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            padding: '10px 12px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '1px',
          }}>
            no match found
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="rank-grid" style={{
        padding: '0 clamp(8px, 3vw, 16px) clamp(8px, 2vw, 14px)',
        marginBottom: 8,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 'clamp(9px, 1.5vw, 12px)',
        fontWeight: 600,
        letterSpacing: 'clamp(0.8px, 0.3vw, 1.5px)',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>#</div>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>Builder</span>
        <span className="hidden sm:block" style={{ textAlign: 'right' }}>Attendance</span>
        <span className="hidden sm:block" style={{ textAlign: 'right' }}>Projects</span>
        <span className="hidden sm:block" style={{ textAlign: 'right' }}>#0to100x</span>
        <span style={{ textAlign: 'right', color: 'rgba(249,104,70,0.9)' }}>Total XP</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: '48px 16px', textAlign: 'center',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13, color: 'rgba(255,255,255,0.25)', letterSpacing: '2px',
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
                <RankRow
                  student={student}
                  isTop3={student.rank <= 3}
                  highlighted={student.id === highlightId}
                />
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
