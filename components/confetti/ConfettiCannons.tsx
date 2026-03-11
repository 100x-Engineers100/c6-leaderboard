'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const COLORS = ['#FF6B35', '#F96846', '#FFFFFF', '#FF4500']

export function ConfettiCannons() {
  useEffect(() => {
    const duration = 450
    const end = Date.now() + duration

    const defaults = {
      particleCount: 9,
      spread: 50,
      startVelocity: 50,
      decay: 0.94,
      gravity: 1.5,
      ticks: 120,
      colors: COLORS,
    }

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval)
        return
      }

      // Left bottom corner
      confetti({ ...defaults, angle: 60, origin: { x: 0, y: 1 } })

      // Right bottom corner
      confetti({ ...defaults, angle: 120, origin: { x: 1, y: 1 } })
    }, 30)

    return () => clearInterval(interval)
  }, [])

  return null
}
