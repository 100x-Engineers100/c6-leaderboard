'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { VALID_EVENT_TYPES, EVENT_CONFIG, type EventType } from '@/lib/event-config'
import { getSupabaseBrowser } from '@/lib/supabase-client'

type PreviewStudent = {
  email: string
  name: string
  points: number
  rawScore: number
}

type PreviewData = {
  students: PreviewStudent[]
  total_students: number
  unmatched_emails: string[]
}

type UploadState = 'idle' | 'previewing' | 'preview_ready' | 'uploading' | 'success' | 'error'

type TabState = {
  file: File | null
  preview: PreviewData | null
  state: UploadState
  message: string
  lastBatch: { row_count: number; upserted: number; uploaded_at: string } | null
}

function emptyTabState(): TabState {
  return { file: null, preview: null, state: 'idle', message: '', lastBatch: null }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<EventType>('assignment_1')
  const [tabs, setTabs] = useState<Record<EventType, TabState>>(() =>
    Object.fromEntries(VALID_EVENT_TYPES.map(t => [t, emptyTabState()])) as Record<EventType, TabState>
  )
  const [isDragging, setIsDragging] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const updateTab = useCallback((tab: EventType, patch: Partial<TabState>) => {
    setTabs(prev => ({ ...prev, [tab]: { ...prev[tab], ...patch } }))
  }, [])

  useEffect(() => {
    const tab = activeTab
    fetch(`/api/admin/upload/${tab}`)
      .then(r => r.json())
      .then(data => {
        if (data.lastBatch) updateTab(tab, { lastBatch: data.lastBatch })
      })
      .catch(() => {})
  }, [activeTab, updateTab])

  async function handleFileSelected(tab: EventType, file: File) {
    updateTab(tab, { file, state: 'previewing', preview: null, message: '' })
    const form = new FormData()
    form.append('file', file)
    form.append('preview', 'true')
    try {
      const res = await fetch(`/api/admin/upload/${tab}`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Preview failed')
      updateTab(tab, { state: 'preview_ready', preview: data })
    } catch (err: unknown) {
      updateTab(tab, { state: 'error', message: err instanceof Error ? err.message : 'Preview failed' })
    }
  }

  async function handleCommit(tab: EventType) {
    const { file } = tabs[tab]
    if (!file) return
    updateTab(tab, { state: 'uploading', message: '' })
    const form = new FormData()
    form.append('file', file)
    form.append('preview', 'false')
    try {
      const res = await fetch(`/api/admin/upload/${tab}`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      updateTab(tab, {
        state: 'success',
        message: `Saved: ${data.upserted} students updated. ${data.unmatched} unmatched.`,
        lastBatch: null,
      })
      fetch(`/api/admin/upload/${tab}`)
        .then(r => r.json())
        .then(d => { if (d.lastBatch) updateTab(tab, { lastBatch: d.lastBatch }) })
        .catch(() => {})
    } catch (err: unknown) {
      updateTab(tab, { state: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
    }
  }

  function handleReset(tab: EventType) {
    updateTab(tab, emptyTabState())
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const current = tabs[activeTab]
  const config = EVENT_CONFIG[activeTab]

  // shared micro-button base
  const microBtn: React.CSSProperties = {
    fontSize: 'clamp(9px, 1.8vw, 11px)',
    fontWeight: 600,
    padding: 'clamp(3px, 0.8vw, 5px) clamp(7px, 1.8vw, 10px)',
    borderRadius: 4,
    cursor: 'pointer',
    letterSpacing: '0.03em',
    transition: 'all 0.12s ease',
    whiteSpace: 'nowrap',
    lineHeight: 1.4,
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#0A0A0A', fontFamily: 'JetBrains Mono, monospace' }}>

      {/* hide tab scrollbar cross-browser */}
      <style>{`.admin-tabs::-webkit-scrollbar{display:none}.admin-tabs{scrollbar-width:none;-ms-overflow-style:none}`}</style>

      {/* orange glow corner blobs — fixed, pointer-events none */}
      <div style={{ position: 'fixed', top: -80, left: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.13) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,104,70,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -60, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,104,70,0.11) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Header ── */}
      <div style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(10,10,10,0.94)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Row 1: centered logo */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'clamp(10px, 2.5vw, 18px) 0 clamp(6px, 1.5vw, 10px)' }}>
          <Image
            src="/podium.png"
            alt="Leaderboard"
            width={240}
            height={80}
            style={{
              objectFit: 'contain',
              width: 'clamp(100px, 22vw, 180px)',
              height: 'auto',
              filter: 'drop-shadow(0 0 12px rgba(249,104,70,0.30))',
            }}
            priority
          />
        </div>

        {/* Row 2: admin label + email + buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(5px, 1.2vw, 8px) clamp(12px, 3.5vw, 24px) clamp(8px, 2vw, 12px)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'clamp(8px, 1.8vw, 10px)', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#FF6B35' }}>
              Admin Panel
            </span>
            {userEmail && (
              <span style={{
                fontSize: 'clamp(7px, 1.5vw, 9px)', color: '#444', fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 'clamp(80px, 20vw, 200px)',
              }}>
                · {userEmail}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button
              onClick={handleLogout}
              style={{ ...microBtn, border: '1px solid rgba(255,255,255,0.09)', color: '#888', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
            >
              Logout
            </button>
            <a
              href="/"
              style={{ ...microBtn, border: '1px solid rgba(255,107,53,0.25)', color: '#FF6B35', background: 'rgba(255,107,53,0.05)', textDecoration: 'none', display: 'inline-block' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,53,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,107,53,0.05)')}
            >
              &larr; Home
            </a>
          </div>
        </div>
      </div>

      {/* ── Tab strip (no scrollbar) ── */}
      <div
        className="admin-tabs"
        style={{
          background: 'rgba(8,8,8,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0 clamp(12px, 3.5vw, 24px)',
          display: 'flex',
          overflowX: 'auto',
        }}
      >
        {VALID_EVENT_TYPES.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: 'clamp(6px, 1.4vw, 9px) clamp(8px, 2vw, 13px)',
              fontSize: 'clamp(9px, 1.9vw, 11px)',
              fontWeight: activeTab === tab ? 700 : 500,
              whiteSpace: 'nowrap',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? '#FF6B35' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === tab ? '#FF6B35' : '#4a4a4a',
              cursor: 'pointer',
              transition: 'color 0.12s, border-color 0.12s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = '#aaa' }}
            onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = '#4a4a4a' }}
          >
            {EVENT_CONFIG[tab].label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(18px, 4vw, 28px) clamp(12px, 3.5vw, 20px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>

        {/* Last batch — compact inline strip */}
        {current.lastBatch && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 2vw, 14px)',
            flexWrap: 'wrap',
            padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 12px)',
            background: 'rgba(255,107,53,0.03)',
            border: '1px solid rgba(255,107,53,0.10)',
            borderLeft: '2px solid rgba(255,107,53,0.40)',
            borderRadius: 5,
            fontSize: 'clamp(8px, 1.7vw, 10px)',
            color: '#4a4a4a',
          }}>
            <span style={{ color: '#FF6B35', fontWeight: 700, letterSpacing: '0.06em' }}>LAST BATCH</span>
            <span>{new Date(current.lastBatch.uploaded_at).toLocaleString()}</span>
            <span style={{ color: '#2a2a2a' }}>·</span>
            <span><span style={{ color: '#bbb', fontWeight: 700 }}>{current.lastBatch.row_count}</span> rows</span>
            <span style={{ color: '#2a2a2a' }}>·</span>
            <span><span style={{ color: '#bbb', fontWeight: 700 }}>{current.lastBatch.upserted}</span> updated</span>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setIsDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFileSelected(activeTab, f)
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: isDragging ? 'rgba(255,107,53,0.05)' : 'rgba(14,14,14,0.80)',
            border: `1px dashed ${isDragging ? 'rgba(255,107,53,0.50)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            padding: 'clamp(18px, 4.5vw, 32px) clamp(12px, 3.5vw, 20px)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          onMouseLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFileSelected(activeTab, f)
            }}
          />
          {current.file ? (
            <div>
              <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#FF6B35', fontWeight: 700, letterSpacing: '0.14em', marginBottom: 5 }}>[ CSV READY ]</div>
              <p style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: '#ccc', fontWeight: 600 }}>{current.file.name}</p>
              <p style={{ fontSize: 'clamp(9px, 1.8vw, 10px)', color: '#444', marginTop: 3 }}>{(current.file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 'clamp(16px, 3.5vw, 22px)', color: 'rgba(255,255,255,0.07)', fontWeight: 700, marginBottom: 7, letterSpacing: '0.05em' }}>[ + ]</div>
              <p style={{ fontSize: 'clamp(10px, 2.2vw, 12px)', color: '#777', fontWeight: 600 }}>Drop CSV or click to browse</p>
              <p style={{ fontSize: 'clamp(9px, 1.8vw, 10px)', color: '#333', marginTop: 4 }}>{config.hint}</p>
            </div>
          )}
        </div>

        {/* Status */}
        {(current.state === 'previewing' || current.state === 'uploading') && (
          <p style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#666', fontWeight: 600, letterSpacing: '0.04em' }}>
            {current.state === 'previewing' ? '... parsing CSV' : '... saving to database'}
          </p>
        )}
        {current.state === 'error' && (
          <div style={{
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
            borderLeft: '2px solid rgba(239,68,68,0.55)', borderRadius: 5,
            padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)',
            fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 600, color: '#fca5a5',
          }}>
            [ERROR] {current.message}
          </div>
        )}
        {current.state === 'success' && (
          <div style={{
            background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)',
            borderLeft: '2px solid rgba(34,197,94,0.55)', borderRadius: 5,
            padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2.5vw, 12px)',
            fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 600, color: '#86efac',
          }}>
            [OK] {current.message}
          </div>
        )}

        {/* Preview */}
        {current.state === 'preview_ready' && current.preview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* preview controls row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#666', fontWeight: 600 }}>
                <span style={{ color: '#ddd' }}>{current.preview.total_students}</span> matched
                {current.preview.unmatched_emails.length > 0 && (
                  <span style={{ color: '#fbbf24', marginLeft: 8 }}>
                    / <span style={{ fontWeight: 700 }}>{current.preview.unmatched_emails.length}</span> unmatched
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={() => handleReset(activeTab)}
                  style={{ ...microBtn, border: '1px solid rgba(255,255,255,0.09)', color: '#777', background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#777'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCommit(activeTab)}
                  style={{ ...microBtn, border: 'none', background: 'linear-gradient(90deg,#FF6B35,#F96846)', color: '#fff', boxShadow: '0 0 10px rgba(255,107,53,0.28)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 18px rgba(255,107,53,0.50)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 10px rgba(255,107,53,0.28)' }}
                >
                  Upload & Save
                </button>
              </div>
            </div>

            {/* unmatched warning */}
            {current.preview.unmatched_emails.length > 0 && (
              <div style={{
                background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.12)',
                borderLeft: '2px solid rgba(234,179,8,0.45)', borderRadius: 5,
                padding: 'clamp(5px, 1.2vw, 7px) clamp(8px, 2vw, 12px)',
                fontSize: 'clamp(8px, 1.8vw, 10px)', fontWeight: 600, color: '#fde68a',
              }}>
                [WARN] Not in DB: {current.preview.unmatched_emails.slice(0, 5).join(', ')}
                {current.preview.unmatched_emails.length > 5 && ` +${current.preview.unmatched_emails.length - 5} more`}
              </div>
            )}

            {/* table */}
            <div style={{ background: 'rgba(12,12,12,0.90)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 7, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['#', 'Name', 'Email', 'Raw', 'XP'].map((h, i) => (
                      <th key={h} style={{
                        padding: 'clamp(5px, 1.2vw, 7px) clamp(7px, 1.8vw, 10px)',
                        fontSize: 'clamp(7px, 1.5vw, 9px)', color: '#3a3a3a', fontWeight: 700,
                        textAlign: i >= 3 ? 'right' : 'left', letterSpacing: '0.08em', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {current.preview.students.slice(0, 50).map((s, i) => (
                    <tr
                      key={s.email}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: 'clamp(4px, 1vw, 6px) clamp(7px, 1.8vw, 10px)', fontSize: 'clamp(8px, 1.8vw, 10px)', color: '#333', fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: 'clamp(4px, 1vw, 6px) clamp(7px, 1.8vw, 10px)', fontSize: 'clamp(9px, 2vw, 11px)', color: '#ccc', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: 'clamp(4px, 1vw, 6px) clamp(7px, 1.8vw, 10px)', fontSize: 'clamp(8px, 1.8vw, 10px)', color: '#555', fontWeight: 500 }}>{s.email}</td>
                      <td style={{ padding: 'clamp(4px, 1vw, 6px) clamp(7px, 1.8vw, 10px)', fontSize: 'clamp(8px, 1.8vw, 10px)', color: '#666', fontWeight: 600, textAlign: 'right' }}>{s.rawScore}</td>
                      <td style={{ padding: 'clamp(4px, 1vw, 6px) clamp(7px, 1.8vw, 10px)', fontSize: 'clamp(9px, 2vw, 11px)', color: '#FF6B35', fontWeight: 700, textAlign: 'right' }}>{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {current.preview.students.length > 50 && (
                <div style={{ padding: 'clamp(4px, 1vw, 6px) clamp(7px, 1.8vw, 10px)', fontSize: 'clamp(8px, 1.6vw, 9px)', color: '#333' }}>
                  +{current.preview.students.length - 50} more rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset after success */}
        {current.state === 'success' && (
          <button
            onClick={() => handleReset(activeTab)}
            style={{ fontSize: 'clamp(9px, 2vw, 10px)', fontWeight: 600, color: '#444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#aaa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#444')}
          >
            Upload another file
          </button>
        )}
      </div>
    </div>
  )
}
