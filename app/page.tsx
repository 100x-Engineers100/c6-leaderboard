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

      {/* Pattern overlay — fixed, full page, very high transparency */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'url(/back_pattern.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundPosition: 'center -150px',
        opacity: 0.5,
        zIndex: -1,
        pointerEvents: 'none',
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

      {/* Brand text — replaces navbar, sits directly on background */}
      <div style={{
        position: 'fixed',
        top: 20,
        left: 32,
        zIndex: 50,
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '4px',
        textTransform: 'uppercase',
        color: '#F96846',
        textShadow: '0 0 18px rgba(249,104,70,0.55)',
      }}>
        100xEngineers
      </div>

      <HeroSection />
      <LeaderboardSection />
    </main>
  )
}
