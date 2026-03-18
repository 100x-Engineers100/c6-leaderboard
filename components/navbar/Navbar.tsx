'use client'

export function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-3"
    >
      {/* Floating pill container — frozen glass */}
      <div
        className="max-w-7xl mx-auto flex items-center justify-between px-3 py-2 sm:px-6 sm:py-3 rounded-2xl"
        style={{
          background: 'rgba(10, 10, 10, 0.60)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        {/* Top-edge ice reflection */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 25%)',
            pointerEvents: 'none',
          }}
        />

        <span className="font-sans text-[10px] sm:text-xs tracking-[2px] sm:tracking-[4px] uppercase text-white/45 relative">
          100xEngineers
        </span>

        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-[2px] uppercase relative"
          style={{
            background: 'rgba(249,104,70,0.10)',
            border: '1px solid rgba(249,104,70,0.22)',
            color: 'rgba(249,104,70,0.85)',
          }}
        >
          <span
            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{
              background: '#F96846',
              animation: 'blink 2s ease-in-out infinite',
            }}
          />
          C6 Live
        </div>
      </div>
    </nav>
  )
}
