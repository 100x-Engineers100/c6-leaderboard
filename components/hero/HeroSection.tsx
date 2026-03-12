'use client'
import Image from 'next/image'
import { PodiumTVs } from './PodiumTVs'

export function HeroSection() {
  return (
    <section style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', // Align to top
      overflow: 'hidden',
      minHeight: '100vh',
      maxHeight: '100vh',
      paddingTop: '2vh',
      paddingBottom: '2vh',
    }}>
      {/* Perspective grid -- decorative floor */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 5,
        right: 5,
        height: '60vh', // Slightly reduced to avoid overwhelming the center
        zIndex: 1,
        overflow: 'hidden',
        perspective: '800px', // More natural perspective
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          inset: '-100% -50% 0 -50%', // Wide enough to cover all angles
          transform: 'rotateX(65deg)', // Adjusted angle for better convergence
          transformOrigin: 'bottom center',
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.62) 1.5px, transparent 2px),
            linear-gradient(to bottom, rgba(255,255,255,0.62) 1.5px, transparent 2px)
          `,
          backgroundSize: '90px 90px',
          opacity: 1,
          WebkitMaskImage: 'radial-gradient(ellipse at center bottom, white 0%, transparent 80%)',
          maskImage: 'radial-gradient(ellipse at center bottom, white 0%, transparent 80%)',
        }} />

        {/* Subtle radial fade to focus center and soften edges */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 0% 0%, transparent 0%, rgba(10,10,10,0.4) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Shadow floor to ground the TVs */}
        {/* Shadow floor to ground the TVs */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '25vh',
          background: 'linear-gradient(to bottom, transparent, #0A0A0A)',
        }} />
      </div>

      {/* Brand label */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.4em',
        color: 'rgba(255,255,255,0.5)',
        marginTop: 15, // Pushing brand label down from header
        marginBottom: -5,
        textTransform: 'uppercase',
      }}>
        100xEngineers
      </div>

      {/* Title image */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        marginBottom: '0.5vh',
        filter: 'drop-shadow(0 0 30px rgba(249,104,70,0.15))'
      }}>
        <Image
          src="/podium.png"
          alt="Leaderboard"
          width={240}
          height={80}
          style={{ objectFit: 'contain', maxWidth: '85vw', width: 'auto', height: 'auto' }}
          priority
        />
      </div>

      {/* TVs — Now a 3-column grid container */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <PodiumTVs />
      </div>
    </section>
  )
}
