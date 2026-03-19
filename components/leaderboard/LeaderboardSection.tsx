'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import type { Student } from '@/lib/types'
import { RankTable } from './RankTable'

type Props = {
  students: Student[]
  loading: boolean
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 16px)', marginBottom: 'clamp(12px, 3vw, 32px)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(90deg, rgba(249,104,70,0.1) 0%, transparent 100%)',
          padding: 'clamp(3px, 0.8vw, 6px) clamp(8px, 2.5vw, 14px) clamp(3px, 0.8vw, 6px) clamp(5px, 1.5vw, 8px)',
          borderRadius: 100,
          border: '1px solid rgba(249,104,70,0.2)',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 'clamp(9px, 2.2vw, 13px)',
            letterSpacing: 'clamp(0.1em, 0.5vw, 0.25em)',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            Full Rankings
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 12, height: 1, background: 'linear-gradient(90deg, rgba(249,104,70,0.3) 0%, rgba(255,255,255,0.05) 100%)' }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 8px)',
          padding: 'clamp(3px, 0.8vw, 6px) clamp(6px, 2vw, 12px)',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 100,
          border: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 'clamp(8px, 2vw, 11px)',
            letterSpacing: 'clamp(0.08em, 0.3vw, 0.2em)',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap',
          }}>
            Cohort 7 <span style={{ color: 'rgba(249,104,70,0.8)' }}>·</span> {count}
          </span>
        </div>
      </div>

      <RankTable students={students} loading={loading} />
    </section>
  )
}
