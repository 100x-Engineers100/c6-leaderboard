'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const POINTS = [
  { label: 'Attendance', detail: '20 XP / session', sub: '(Fri + Sat lectures)' },
  { label: 'Assignments', detail: '= score out of 20', sub: null },
  { label: '#0to100x', detail: '20 XP / post', sub: '+10 XP weekly streak' },
  { label: 'Mini Hackathon', detail: '= score out of 100', sub: null },
  { label: 'Mid Capstone', detail: '50 XP on submit', sub: null },
  { label: 'Final Capstone', detail: '200 XP on submit', sub: null },
]

type Props = {
  mobileInline?: boolean
}

export function EasterEgg({ mobileInline = false }: Props) {
  const [open, setOpen] = useState(false)
  // Portal target — only available client-side
  const [mounted, setMounted] = useState(false)
  const coinRef = useRef<HTMLDivElement>(null)
  const [popupPos, setPopupPos] = useState({ top: 60, right: 24 })

  useEffect(() => {
    setMounted(true)
  }, [])

  // When popup opens, compute position from the coin's actual viewport coords
  useEffect(() => {
    if (!open || !coinRef.current) return
    const rect = coinRef.current.getBoundingClientRect()
    const popupWidth = 260
    const gap = 8
    // Place popup below the coin, aligned to its right edge
    const right = Math.max(8, window.innerWidth - rect.right)
    const top = rect.bottom + gap
    setPopupPos({ top, right })
  }, [open])

  const popup = (
    <>
      {/* Overlay — rendered in portal, always above everything */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'transparent' }}
      />

      {/* Popup */}
      <div style={{
        position: 'fixed',
        top: popupPos.top,
        right: popupPos.right,
        zIndex: 9999,
        width: 260,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.08)',
        borderRadius: 6,
        padding: '14px 16px',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <div style={{
          fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase',
          color: 'rgba(249,104,70,0.80)', marginBottom: 10, textAlign: 'center',
        }}>
          * Points System *
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 }} />

        {POINTS.map(({ label, detail, sub }) => (
          <div key={label} style={{ marginBottom: sub ? 10 : 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>{label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.80)', textAlign: 'right' }}>{detail}</span>
            </div>
            {sub && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', textAlign: 'right', marginTop: 2 }}>{sub}</div>
            )}
          </div>
        ))}
      </div>
    </>
  )

  return (
    <>
      {/* Popup via portal — renders directly into document.body, escapes ALL stacking contexts */}
      {mounted && open && createPortal(popup, document.body)}

      {/* Coin trigger */}
      <div
        ref={coinRef}
        onClick={() => setOpen(v => !v)}
        title="Points system"
        style={mobileInline ? {
          width: 32,
          height: 32,
          cursor: 'pointer',
          flexShrink: 0,
          animationName: 'spin-y',
          animationDuration: '4s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: open ? 'paused' : 'running',
        } : {
          position: 'fixed',
          top: 20,
          right: 24,
          zIndex: 999,
          width: 40,
          height: 40,
          cursor: 'pointer',
          animationName: 'spin-y',
          animationDuration: '4s',
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationPlayState: open ? 'paused' : 'running',
        }}
      >
        <img src="/coin.png" alt="Points info" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
    </>
  )
}
