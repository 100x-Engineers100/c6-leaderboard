'use client'
import { HeroSection } from '@/components/hero/HeroSection'
import { R3FBackground } from '@/components/hero/R3FBackground'
import { LeaderboardSection } from '@/components/leaderboard/LeaderboardSection'
import { useLenis } from '@/hooks/useLenis'
import { ConfettiCannons } from '@/components/confetti/ConfettiCannons'
import { useLeaderboard } from '@/hooks/useLeaderboard'

export default function Page() {
  useLenis()
  const { students, top3, loading } = useLeaderboard()

  return (
    <main style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Base Background Layer */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#07060A',
        zIndex: -1,
      }} />

      {/* Bottom black gradient */}
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

      {/* Stars and Decor */}
      <R3FBackground />
      <ConfettiCannons />

      <HeroSection top3={top3} />
      <LeaderboardSection students={students} loading={loading} />
    </main>
  )
}
