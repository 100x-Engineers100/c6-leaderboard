import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Leaderboard C7 — 100xEngineers',
  description: 'Cohort 7 live rankings',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
