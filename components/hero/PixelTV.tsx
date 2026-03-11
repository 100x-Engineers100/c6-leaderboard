'use client'
import type { Student } from '@/lib/types'
import { NumberTicker } from '@/components/ui/NumberTicker'

type Props = {
  student: Student
  rank: 1 | 2 | 3
  size?: 'lg' | 'md'
}

const RANK_COLORS = {
  1: { glow: 'rgba(249,104,70,0.40)', text: '#F96846', nameColor: 'rgba(255,255,255,0.85)' },
  2: { glow: 'rgba(232,160,32,0.25)', text: '#E8A020', nameColor: 'rgba(255,255,255,0.70)' },
  3: { glow: 'rgba(160,160,160,0.15)', text: 'rgba(200,200,200,0.70)', nameColor: 'rgba(255,255,255,0.55)' },
}

// Screen area offsets as % of the TV image dimensions (tv_3.png)
// Adjust these if the photo isn't aligned with the screen hole
const SCREEN = {
  left: '9%',
  top: '37%',
  width: '65%',
  height: '47%',
}

export function PixelTV({ student, rank, size = 'md' }: Props) {
  const color = RANK_COLORS[rank]
  const isLg = size === 'lg'

  // TV container dimensions — keep same aspect ratio as tv_3.png (~306x290)
  const tvW = isLg ? 260 : 210
  const tvH = Math.round(tvW * (290 / 306))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* TV wrapper */}
      <div style={{
        position: 'relative',
        width: tvW,
        height: tvH,
        filter: `drop-shadow(0 0 18px ${color.glow}) drop-shadow(0 8px 20px rgba(0,0,0,0.7))`,
      }}>
        {/* Student photo — sits behind TV frame, clipped to screen area */}
        <div style={{
          position: 'absolute',
          left: SCREEN.left,
          top: SCREEN.top,
          width: SCREEN.width,
          height: SCREEN.height,
          overflow: 'hidden',
          borderRadius: 2,
        }}>
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: '#111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isLg ? 28 : 22,
              fontWeight: 700,
              color: color.text,
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '2px',
            }}>
              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* CRT scanlines over photo */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.10) 3px, rgba(0,0,0,0.10) 4px)',
            pointerEvents: 'none',
          }} />

          {/* Corner glare */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 40%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* TV frame image — on top */}
        <img
          src="/tv_3.png"
          alt="TV frame"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Rank badge */}
      <img
        src={`/rank${rank}.png`}
        alt={`Rank ${rank}`}
        style={{
          width: isLg ? 140 : 170,
          height: 'auto',
          filter: `drop-shadow(0 0 10px ${color.glow})`,
        }}
      />

      {/* Name */}
      <div style={{
        fontSize: isLg ? 32 : 24,
        fontWeight: 700,
        color: color.nameColor,
        textAlign: 'center',
        maxWidth: tvW + 20,
        lineHeight: 1.3,
        letterSpacing: '0.2px',
        fontFamily: 'Space Grotesk, sans-serif',
      }}>
        {student.name}
      </div>

      {/* Points */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: isLg ? 18 : 15,
        fontWeight: 800,
        color: color.text,
        letterSpacing: '1px',
        opacity: 1,
      }}>
        <NumberTicker
          value={student.points}
          startValue={Math.max(0, student.points - 200)}
          delay={0.4}
          style={{ color: color.text, opacity: 1 }}
        /> pts
      </div>
    </div>
  )
}
