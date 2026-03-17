'use client'
import { useState, useEffect } from 'react'
import type { Student } from '@/lib/types'
import { FALLBACK_STUDENTS, FALLBACK_TOP_3 } from '@/lib/dummy-data'

type LeaderboardState = {
  students: Student[]
  top3:     Student[]
  loading:  boolean
  error:    string | null
}

export function useLeaderboard(): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({
    students: [],
    top3:     [],
    loading:  true,
    error:    null,
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/leaderboard')
      .then(r => {
        if (!r.ok) throw new Error(`API error ${r.status}`)
        return r.json()
      })
      .then((data: Student[]) => {
        if (cancelled) return
        setState({
          students: data,
          top3:     data.slice(0, 3),
          loading:  false,
          error:    null,
        })
      })
      .catch((err: Error) => {
        if (cancelled) return
        console.warn('[WARN] Leaderboard API failed, using fallback:', err.message)
        setState({
          students: FALLBACK_STUDENTS,
          top3:     FALLBACK_TOP_3,
          loading:  false,
          error:    err.message,
        })
      })
    return () => { cancelled = true }
  }, [])

  return state
}
