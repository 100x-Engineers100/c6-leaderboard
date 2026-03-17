'use client'
import type { RefObject } from 'react'
import type { Student } from '@/lib/types'
import { NumberTicker } from '@/components/ui/NumberTicker'

type Props = {
  student: Student
  rank: 1 | 2 | 3
  frameSize: number
  frameRef?: RefObject<HTMLDivElement>
  // Individual Controls
  medalSize?: number
  medalMarginTop?: number | string
  nameSize?: number
  nameLineHeight?: number | string
  pointsSize?: number
  moveUpwards?: number | string
}

const RANK_COLORS = {
  1: { glow: 'rgba(249,104,70,0.40)', text: '#F96846', nameColor: 'rgba(255,255,255,0.85)', frame: '/gold_frame.png' },
  2: { glow: 'rgba(232,160,32,0.25)', text: '#E8A020', nameColor: 'rgba(255,255,255,0.70)', frame: '/silver_frame.png' },
  3: { glow: 'rgba(160,160,160,0.15)', text: 'rgba(200,200,200,0.70)', nameColor: 'rgba(255,255,255,0.55)', frame: '/broze_frame.png' },
}

// Inner avatar area as % of new frames - adjusted to ensure no overflow
const SCREEN = {
  left: '14%',
  top: '14%',
  width: '72%',
  height: '72%',
}

export function PixelTV({
  student,
  rank,
  frameSize,
  frameRef,
  medalSize = 150,
  medalMarginTop = -20,
  nameSize = 26,
  nameLineHeight = 0.8,
  pointsSize = 12,
  moveUpwards = -10
}: Props) {
  const color = RANK_COLORS[rank]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      width: '100%',
      height: '100%',
      padding: '40px 40px',
    }}>

      {/* Frame + avatar — GSAP animates this div via frameRef */}
      <div
        ref={frameRef}
        style={{
          position: 'relative',
          width: frameSize,
          height: frameSize,
          filter: `drop-shadow(0 0 18px ${color.glow}) drop-shadow(0 8px 20px rgba(0,0,0,0.7))`,
        }}
      >
        {/* Avatar behind the frame */}
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
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: '#111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: frameSize > 150 ? 28 : 28,
              fontWeight: 700,
              color: color.text,
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '2px',
            }}>
              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}

          {/* CRT scanlines */}
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

        {/* Frame overlay — rank specific */}
        <img
          src={color.frame}
          alt={`${rank} frame`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
          }}
        />

        {/* Retro HUD Elements */}
        <div style={{
          position: 'absolute',
          top: '4%',
          right: '5%',
          fontSize: 8,
          fontFamily: 'JetBrains Mono, monospace',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          REC 0{rank}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '4%',
          left: '5%',
          fontSize: 8,
          fontFamily: 'JetBrains Mono, monospace',
          color: color.text,
          opacity: 0.6,
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          RANK_{rank}
        </div>
      </div>


      {/* RANK MEDAL PNG HANDLING — Standardized container for perfect name alignment */}
      <div style={{
        height: 140, // Consistent height for all ranks ensures names align
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: medalMarginTop
      }}>
        <img
          src={`/rank${rank}.png`}
          alt={`Rank ${rank}`}
          style={{
            width: medalSize,
            height: 'auto',
            filter: `drop-shadow(0 0 25px ${color.glow})`,
            zIndex: 4,
          }}
        />
      </div>

      {/* Name and Points Group — Standardized alignment */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        marginTop: moveUpwards,
        justifyContent: 'flex-start',
        width: '100%'
      }}>
        <div style={{
          fontSize: nameSize,
          fontWeight: 800,
          color: color.nameColor,
          textAlign: 'center',
          maxWidth: 400,
          lineHeight: nameLineHeight,
          letterSpacing: '-0.02em',
          fontFamily: 'Space Grotesk, sans-serif',
          textTransform: 'uppercase',
        }}>
          {student.name}
        </div>

        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: pointsSize,
          fontWeight: 800,
          color: color.text,
          letterSpacing: '2px',
        }}>
          <NumberTicker
            value={student.total_points}
            startValue={Math.max(0, student.total_points - 200)}
            delay={0.4}
            style={{ color: color.text, opacity: 1 }}
          /> XP
        </div>

        {rank === 1 && (
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(249,104,70,0.75)',
            marginTop: 4,
          }}>
            🔥Leading the cohort
          </div>
        )}
      </div>
    </div>
  )
}
