'use client'
import { useState } from 'react'
import type { Student } from '@/lib/types'

type Props = { student: Student; isTop3?: boolean; highlighted?: boolean }

function pts(n: number) {
  return n > 0
    ? <span style={{ color: 'rgba(255,255,255,0.65)' }}>{n}</span>
    : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>
}

export function RankRow({ student, isTop3 = false, highlighted = false }: Props) {
  const [open, setOpen] = useState(false)
  const {
    rank, name,
    attendance_pts, ugc_post_pts, capstone_pts,
    assignment_pts, hackathon_pts, consistency_bonus_pts,
    total_points,
  } = student

  const sessions = Math.round(attendance_pts / 20)
  const posts = Math.floor(ugc_post_pts / 20)

  const accentColor = isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.45)'

  return (
    <div>
      {/* Main row */}
      <div
        className="rank-grid items-center px-4 py-3 mb-[2px] transition-colors duration-100"
        style={{
          background: open
            ? (isTop3 ? 'rgba(249,104,70,0.12)' : 'rgba(255,255,255,0.07)')
            : highlighted ? 'rgba(249,104,70,0.14)'
            : (isTop3 ? 'rgba(249,104,70,0.06)' : 'rgba(255,255,255,0.04)'),
          borderRadius: open ? '4px 4px 0 0' : 4,
          border: '1px solid',
          borderColor: highlighted ? 'rgba(249,104,70,0.55)' : (isTop3 ? 'rgba(249,104,70,0.20)' : 'rgba(255,255,255,0.09)'),
          borderLeft: highlighted ? '2px solid rgba(249,104,70,0.90)' : (isTop3 ? '2px solid rgba(249,104,70,0.60)' : '2px solid transparent'),
          transition: 'background 0.4s ease, border-color 0.4s ease',
          borderBottom: open ? '1px solid transparent' : undefined,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setOpen(v => !v)}
        onMouseEnter={e => {
          if (open) return
          const el = e.currentTarget as HTMLElement
          el.style.background = isTop3 ? 'rgba(249,104,70,0.10)' : 'rgba(255,255,255,0.07)'
        }}
        onMouseLeave={e => {
          if (open) return
          const el = e.currentTarget as HTMLElement
          el.style.background = isTop3 ? 'rgba(249,104,70,0.06)' : 'rgba(255,255,255,0.04)'
        }}
      >
        {/* Rank */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isTop3 ? (
            <img src={`/rank${rank}.png`} alt={`Rank ${rank}`} style={{ width: 'clamp(40px, 5vw, 56px)', height: 'clamp(40px, 5vw, 56px)', objectFit: 'contain' }} />
          ) : (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13, fontWeight: 700,
              color: 'rgba(255,255,255,0.50)', letterSpacing: '0.5px',
            }}>
              {String(rank).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Name */}
        <span style={{
          fontSize: 16, fontWeight: 500,
          color: isTop3 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.82)',
          letterSpacing: '0.2px',
        }}>
          {name}
        </span>

        {/* Attendance */}
        <span className="hidden sm:block" style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 600,
          textAlign: 'right',
        }}>
          {pts(attendance_pts)}
        </span>

        {/* Projects (capstone + hackathon) */}
        <span className="hidden sm:block" style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 600,
          textAlign: 'right',
        }}>
          {pts(capstone_pts + (hackathon_pts ?? 0))}
        </span>

        {/* #0to100x */}
        <span className="hidden sm:block" style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14, fontWeight: 600,
          textAlign: 'right',
        }}>
          {pts(ugc_post_pts)}
        </span>

        {/* Total XP + chevron */}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13, fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.65)',
          letterSpacing: '0.5px',
          textAlign: 'right',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
        }}>
          {total_points.toLocaleString()}
          <span style={{
            fontSize: 10,
            color: accentColor,
            transition: 'transform 0.2s ease',
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}>
            {'>'}
          </span>
        </span>
      </div>

      {/* Accordion breakdown */}
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? 320 : 0,
        transition: 'max-height 0.25s ease',
        marginBottom: open ? 2 : 0,
      }}>
        <div style={{
          background: isTop3 ? 'rgba(249,104,70,0.06)' : 'rgba(255,255,255,0.03)',
          border: '1px solid',
          borderTop: 'none',
          borderColor: isTop3 ? 'rgba(249,104,70,0.20)' : 'rgba(255,255,255,0.09)',
          borderLeft: isTop3 ? '2px solid rgba(249,104,70,0.60)' : '2px solid transparent',
          borderRadius: '0 0 4px 4px',
          padding: '12px 16px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <div style={{
            fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase',
            color: accentColor, marginBottom: 8,
          }}>
            XP Breakdown
          </div>

          {/* breakdown rows */}
          {[
            { label: 'Attendance', val: attendance_pts, note: sessions > 0 ? `${sessions} session${sessions !== 1 ? 's' : ''} x 20 XP` : null },
            { label: 'Assignments', val: assignment_pts, note: null },
            { label: 'Mini Hackathon', val: hackathon_pts, note: null },
            { label: 'Capstone', val: capstone_pts, note: null },
            { label: '#0to100x', val: ugc_post_pts, note: posts > 0 ? `${posts} post${posts !== 1 ? 's' : ''} x 20 XP` : null },
            { label: 'Consistency', val: consistency_bonus_pts, note: consistency_bonus_pts > 0 ? 'bonus' : null },
          ].map(({ label, val, note }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', minWidth: 130 }}>{label}</span>
              <span style={{ fontSize: 11, color: val > 0 ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.18)', marginLeft: 8 }}>
                {val > 0 ? `${val} XP` : '—'}
              </span>
              {note && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginLeft: 8, textAlign: 'right', flex: 1 }}>
                  {note}
                </span>
              )}
            </div>
          ))}

          {/* total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 8, paddingTop: 6,
            borderTop: `1px solid ${isTop3 ? 'rgba(249,104,70,0.30)' : 'rgba(255,255,255,0.10)'}`,
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.80)' }}>
              {total_points.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
