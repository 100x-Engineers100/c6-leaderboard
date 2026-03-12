'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { RankTable } from './RankTable'

export function LeaderboardSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const glow = glowRef.current
    if (!section || !glow) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    // Same reliable pattern as useScrollGlow — native scroll listener
    const onScroll = () => {
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight
      // progress: 0 when section top is at 90% of viewport, 1 when at 30%
      const raw = (vh * 0.9 - rect.top) / (vh * 0.6)
      const progress = Math.max(0, Math.min(1, raw))
      gsap.set(glow, { opacity: progress })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{ position: 'relative', maxWidth: '80vw', margin: '0 auto', padding: '48px 16px 0' }}
    >
      {/* Entry glow — fades in as section scrolls into view */}
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          fontWeight: 1500,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color: 'rgba(249,104,70,0.50)',
          whiteSpace: 'nowrap',
        }}>
          Full Rankings
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          fontWeight: 1200,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'rgba(144, 137, 137, 0.77)',
          whiteSpace: 'nowrap',
        }}>
          Cohort 7 · 200 Builders
        </span>
      </div>

      <RankTable />
    </section>
  )
}
