import type { Student } from '@/lib/types'

type Props = { student: Student; isTop3?: boolean }

function pts(n: number) {
  return n > 0
    ? <span style={{ color: 'rgba(255,255,255,0.65)' }}>{n}</span>
    : <span style={{ color: 'rgba(255,255,255,0.18)' }}>—</span>
}

export function RankRow({ student, isTop3 = false }: Props) {
  const { rank, name, attendance_pts, ugc_post_pts, capstone_pts, total_points } = student

  return (
    <div
      className="grid items-center gap-3 px-4 py-3 mb-[2px] transition-colors duration-100"
      style={{
        gridTemplateColumns: '44px 1fr 80px 80px 80px 80px',
        background: isTop3 ? 'rgba(249,104,70,0.06)' : 'rgba(255,255,255,0.04)',
        borderRadius: 4,
        border: '1px solid',
        borderColor: isTop3 ? 'rgba(249,104,70,0.20)' : 'rgba(255,255,255,0.09)',
        borderLeft: isTop3 ? '2px solid rgba(249,104,70,0.60)' : '2px solid transparent',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = isTop3 ? 'rgba(249,104,70,0.10)' : 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = isTop3 ? 'rgba(249,104,70,0.06)' : 'rgba(255,255,255,0.04)'
      }}
    >
      {/* Rank */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isTop3 ? (
          <img src={`/rank${rank}.png`} alt={`Rank ${rank}`} style={{ width: 28, height: 'auto' }} />
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
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14, fontWeight: 600,
        textAlign: 'right',
      }}>
        {pts(attendance_pts)}
      </span>

      {/* Projects (capstone + hackathon) */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14, fontWeight: 600,
        textAlign: 'right',
      }}>
        {pts(capstone_pts + (student.hackathon_pts ?? 0))}
      </span>

      {/* #0to100x */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 14, fontWeight: 600,
        textAlign: 'right',
      }}>
        {pts(ugc_post_pts)}
      </span>

      {/* Total XP */}
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13, fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: isTop3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.65)',
        letterSpacing: '0.5px',
        textAlign: 'right',
      }}>
        {total_points.toLocaleString()}
      </span>
    </div>
  )
}
