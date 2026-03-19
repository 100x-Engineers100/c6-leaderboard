'use client'

import { getSupabaseBrowser } from '@/lib/supabase-client'

export default function AdminLoginPage() {
  async function signIn() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <div style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(20,20,20,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '48px 40px',
        textAlign: 'center',
        width: '100%',
        maxWidth: 360,
        boxShadow: '0 24px 60px rgba(0,0,0,0.50)',
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 800,
          background: 'linear-gradient(90deg, #FF6B35, #F96846)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Admin
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
          Score Upload Panel
        </h1>
        <p style={{ fontSize: 11, color: '#555', marginBottom: 32 }}>
          Authorized personnel only
        </p>

        <button
          onClick={signIn}
          style={{
            width: '100%',
            padding: '12px 0',
            fontSize: 13,
            fontWeight: 600,
            background: 'linear-gradient(90deg, #FF6B35, #F96846)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255,107,53,0.35)',
            transition: 'box-shadow 0.15s ease',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 32px rgba(255,107,53,0.55)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(255,107,53,0.35)')}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
