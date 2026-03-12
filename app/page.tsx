'use client'
import { HeroSection } from '@/components/hero/HeroSection'
import { R3FBackground } from '@/components/hero/R3FBackground'
import { LeaderboardSection } from '@/components/leaderboard/LeaderboardSection'
import { BackgroundDecor } from '@/components/layout/BackgroundDecor'
import { useLenis } from '@/hooks/useLenis'
import { ConfettiCannons } from '@/components/confetti/ConfettiCannons'

export default function Page() {
  useLenis()
  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Base Background Layer */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#07060A',
        zIndex: -1,
      }} />


      {/* Bottom black gradient — fixed over bg pattern, covers hero + leaderboard */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55vh',
        background: 'linear-gradient(to bottom, transparent, #07060A)',
        zIndex: -1,
        pointerEvents: 'none',
      }} />

      {/* Stars and Decor — fixed, covers full page scroll */}
      <R3FBackground />
      <BackgroundDecor />

      <ConfettiCannons />

<HeroSection />
      <LeaderboardSection />
    </main>
  )
}
