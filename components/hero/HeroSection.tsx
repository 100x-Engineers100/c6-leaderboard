'use client'
import { useRef } from 'react'
import { PodiumTVs } from './PodiumTVs'
import { useScrollGlow } from '@/hooks/useScrollGlow'

export function HeroSection() {
  const glowWrapperRef = useRef<HTMLDivElement>(null)
  useScrollGlow(glowWrapperRef)

  return (
    <section style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      minHeight: '100vh',
      paddingBottom: '5vh',
    }}>
      {/* Ambient orange radial glow */}
      <div
        ref={glowWrapperRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
          width: 700,
          height: 500,
          background: 'radial-gradient(ellipse at center, rgba(249,104,70,0.35) 0%, rgba(249,104,70,0.10) 40%, transparent 90%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* TVs */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        <PodiumTVs />
      </div>
    </section>
  )
}
