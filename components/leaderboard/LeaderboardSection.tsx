'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { Student } from '@/lib/types'
import { RankTable } from './RankTable'

type Props = {
  students: Student[]
  loading:  boolean
}

export function LeaderboardSection({ students, loading }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const glow = glowRef.current
    if (!section || !glow) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      const raw = (vh * 0.9 - rect.top) / (vh * 0.6)
      const progress = Math.max(0, Math.min(1, raw))
      gsap.set(glow, { opacity: progress })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const count = loading ? '...' : `${students.length} Builders`

  return (
    <section
      ref={sectionRef}
      className="max-w-[95vw] sm:max-w-[80vw]"
      style={{ position: 'relative', margin: '0 auto', padding: 'clamp(24px, 4vw, 48px) clamp(12px, 2vw, 16px) 0' }}
    >
      {/* Entry glow */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: 300,
          background: 'radial-gradient(ellipse at top center, rgba(249,104,70,0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0,
        }}
      />

      {/* Section label */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          color: 'rgba(249,104,70,0.50)',
        }} className="text-[10px] sm:text-sm tracking-[2px] sm:tracking-[4px] font-bold whitespace-nowrap">
          Full Rankings
        </span>
        <div style={{ flex: 1, minWidth: 12, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          color: 'rgba(144,137,137,0.77)',
        }} className="text-[10px] sm:text-sm tracking-[2px] sm:tracking-[3px] whitespace-nowrap">
          Cohort 7 · {count}
        </span>
      </div>

      <RankTable students={students} loading={loading} />
    </section>
  )
}
