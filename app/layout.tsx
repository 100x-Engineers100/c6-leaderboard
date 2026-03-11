import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'C6 Leaderboard — 100xEngineers',
  description: 'Cohort 6 live rankings',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
