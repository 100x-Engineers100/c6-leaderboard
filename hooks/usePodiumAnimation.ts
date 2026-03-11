'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function usePodiumAnimation() {
  const tv1Ref = useRef<HTMLDivElement>(null)
  const tv2Ref = useRef<HTMLDivElement>(null)
  const tv3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([tv1Ref.current, tv2Ref.current, tv3Ref.current], {
        y: -260,
        opacity: 0,
      })

      const tl = gsap.timeline({ delay: 0.4 })

      // #1 drops first — slow weighted fall with soft single overshoot
      tl.to(tv1Ref.current, {
        y: 0, opacity: 1,
        duration: 1.1,
        ease: 'back.out(1.4)',
      })

      // #2 and #3 drop together, slight overlap
      tl.to(
        [tv2Ref.current, tv3Ref.current],
        { y: 0, opacity: 1, duration: 1.0, ease: 'back.out(1.4)' },
        '-=0.5'
      )
    })

    return () => ctx.revert()
  }, [])

  return { tv1Ref, tv2Ref, tv3Ref }
}
