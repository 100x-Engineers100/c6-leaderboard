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
      style={{ position: 'relative', maxWidth: '80vw', margin: '0 auto', padding: '48px 16px 0' }}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 1500,
          letterSpacing: '4px', textTransform: 'uppercase',
          color: 'rgba(249,104,70,0.50)', whiteSpace: 'nowrap',
        }}>
          Full Rankings
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 1200,
          letterSpacing: '3px', textTransform: 'uppercase',
          color: 'rgba(144,137,137,0.77)', whiteSpace: 'nowrap',
        }}>
          Cohort 7 · {count}
        </span>
      </div>

      <RankTable students={students} loading={loading} />
    </section>
  )
}
