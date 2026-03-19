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
    assignment_1_pts = 0, assignment_2_pts = 0, assignment_3_pts = 0, assignment_4_pts = 0,
    midcapstone_pts = 0, final_capstone_pts = 0,
  } = student

  const sessions = Math.round(attendance_pts / 20)
  const posts = Math.floor(ugc_post_pts / 20)

  const accentColor = isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.45)'

  return (
    <div>
      {/* Main row */}
      <div
        className="rank-grid items-center mb-[2px] transition-colors duration-100"
        style={{
          padding: 'clamp(6px, 1.8vw, 12px) clamp(8px, 3vw, 16px)',
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
            <img src={`/rank${rank}.png`} alt={`Rank ${rank}`} style={{ width: 'clamp(26px, 7vw, 48px)', height: 'clamp(26px, 7vw, 48px)', objectFit: 'contain' }} />
          ) : (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'clamp(10px, 2.8vw, 13px)', fontWeight: 700,
              color: 'rgba(255,255,255,0.50)', letterSpacing: '0.5px',
            }}>
              {String(rank).padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Name */}
        <span style={{
          fontSize: 'clamp(11px, 3.5vw, 16px)', fontWeight: 500,
          color: isTop3 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.82)',
          letterSpacing: '0.2px',
        }}>
          {name}
        </span>

        {/* Attendance */}
        <span className="hidden sm:block" style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 600,
          textAlign: 'right',
        }}>
          {pts(attendance_pts)}
        </span>

        {/* Projects (capstone + hackathon) */}
        <span className="hidden sm:block" style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 600,
          textAlign: 'right',
        }}>
          {pts(capstone_pts + (hackathon_pts ?? 0))}
        </span>

        {/* #0to100x */}
        <span className="hidden sm:block" style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 'clamp(11px, 2.5vw, 14px)', fontWeight: 600,
          textAlign: 'right',
        }}>
          {pts(ugc_post_pts)}
        </span>

        {/* Total XP + chevron */}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 'clamp(10px, 2.8vw, 13px)', fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.65)',
          letterSpacing: '0.5px',
          textAlign: 'right',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
        }}>
          {total_points.toLocaleString()}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'clamp(16px, 4vw, 20px)',
            height: 'clamp(16px, 4vw, 20px)',
            borderRadius: '50%',
            background: open
              ? (isTop3 ? 'rgba(249,104,70,0.15)' : 'rgba(255,255,255,0.08)')
              : (isTop3 ? 'rgba(249,104,70,0.05)' : 'transparent'),
            border: `1px solid ${open ? (isTop3 ? 'rgba(249,104,70,0.4)' : 'rgba(255,255,255,0.2)') : (isTop3 ? 'rgba(249,104,70,0.15)' : 'rgba(255,255,255,0.05)')}`,
            boxShadow: open ? `0 0 10px ${isTop3 ? 'rgba(249,104,70,0.2)' : 'rgba(255,255,255,0.05)'}` : 'none',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: open ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1)',
            flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4v16M4 12h16" stroke={isTop3 ? '#FF6B35' : 'rgba(255,255,255,0.8)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>
      </div>

      {/* Accordion breakdown */}
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? 600 : 0,
        transition: 'max-height 0.28s ease',
        marginBottom: open ? 2 : 0,
      }}>
        <div style={{
          background: isTop3 ? 'rgba(249,104,70,0.06)' : 'rgba(255,255,255,0.03)',
          border: '1px solid',
          borderTop: 'none',
          borderColor: isTop3 ? 'rgba(249,104,70,0.20)' : 'rgba(255,255,255,0.09)',
          borderLeft: isTop3 ? '2px solid rgba(249,104,70,0.60)' : '2px solid transparent',
          borderRadius: '0 0 4px 4px',
          padding: 'clamp(8px, 2vw, 12px) clamp(10px, 3vw, 16px)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(10px, 2vw, 12px)',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: accentColor,
              fontWeight: 600,
            }}>
              XP Breakdown
            </span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${isTop3 ? 'rgba(249,104,70,0.2)' : 'rgba(255,255,255,0.05)'} 0%, transparent 100%)` }} />
          </div>

          {/* Aligned 3-col row helper */}
          {(() => {
            // fluid columns: label | value | note (note pushed to far right)
            const cols = 'clamp(90px, 28vw, 150px) clamp(48px, 13vw, 70px) 1fr'
            const labelSz = 'clamp(9px, 2.4vw, 11px)'
            const valueSz = 'clamp(9px, 2.4vw, 11px)'
            const noteSz = 'clamp(8px, 2vw, 10px)'

            const Row = ({ label, val, note, indent }: { label: string; val: number; note?: string | null; indent?: boolean }) => (
              <div style={{
                display: 'grid',
                gridTemplateColumns: cols,
                alignItems: 'baseline',
                padding: 'clamp(2px, 0.5vw, 4px) 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: labelSz, color: indent ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.50)', paddingLeft: indent ? 'clamp(8px, 2vw, 14px)' : 0 }}>
                  {indent ? '- ' : ''}{label}
                </span>
                <span style={{ fontSize: valueSz, color: val > 0 ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.18)', textAlign: 'right' }}>
                  {val > 0 ? `${val} XP` : '—'}
                </span>
                <span style={{ fontSize: noteSz, color: 'rgba(255,255,255,0.28)', textAlign: 'right' }}>
                  {note ?? ''}
                </span>
              </div>
            )

            const GroupHeader = ({ label, total }: { label: string; total: number }) => (
              <div style={{
                display: 'grid',
                gridTemplateColumns: cols,
                alignItems: 'baseline',
                padding: 'clamp(4px, 1vw, 6px) 0 clamp(2px, 0.5vw, 3px)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: labelSz, color: 'rgba(255,255,255,0.50)', fontWeight: 700 }}>{label}</span>
                <span style={{ fontSize: valueSz, color: total > 0 ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.18)', textAlign: 'right' }}>
                  {total > 0 ? `${total} XP` : '—'}
                </span>
                <span />
              </div>
            )

            return (
              <>
                <Row label="Attendance" val={attendance_pts} note={sessions > 0 ? `${sessions} session${sessions !== 1 ? 's' : ''} x 20 XP` : null} />

                <GroupHeader label="Assignments" total={assignment_pts} />
                {assignment_1_pts > 0 && <Row label="Assignment 1" val={assignment_1_pts} indent />}
                {assignment_2_pts > 0 && <Row label="Assignment 2" val={assignment_2_pts} indent />}
                {assignment_3_pts > 0 && <Row label="Assignment 3" val={assignment_3_pts} indent />}
                {assignment_4_pts > 0 && <Row label="Assignment 4" val={assignment_4_pts} indent />}

                <Row label="Mini Hackathon" val={hackathon_pts} />

                <GroupHeader label="Capstone" total={capstone_pts} />
                {midcapstone_pts > 0 && <Row label="Mid Capstone" val={midcapstone_pts} indent />}
                {final_capstone_pts > 0 && <Row label="Final Capstone" val={final_capstone_pts} indent />}

                <Row label="#0to100x" val={ugc_post_pts} note={posts > 0 ? `${posts} post${posts !== 1 ? 's' : ''} x 20 XP` : null} />
                <Row label="Consistency" val={consistency_bonus_pts} note={consistency_bonus_pts > 0 ? 'bonus' : null} />
              </>
            )
          })()}

          {/* total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 8, paddingTop: 6,
            borderTop: `1px solid ${isTop3 ? 'rgba(249,104,70,0.30)' : 'rgba(255,255,255,0.10)'}`,
          }}>
            <span style={{ fontSize: 'clamp(9px, 2.4vw, 11px)', color: 'rgba(255,255,255,0.50)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total</span>
            <span style={{ fontSize: 'clamp(10px, 2.6vw, 12px)', fontWeight: 700, color: isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.80)' }}>
              {total_points.toLocaleString()} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
