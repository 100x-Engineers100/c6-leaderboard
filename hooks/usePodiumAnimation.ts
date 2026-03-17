'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export function usePodiumAnimation(ready: boolean = true) {
  const tv1Ref = useRef<HTMLDivElement>(null)
  const tv2Ref = useRef<HTMLDivElement>(null)
  const tv3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready) return
    if (!tv1Ref.current || !tv2Ref.current || !tv3Ref.current) return

    const ctx = gsap.context(() => {
      gsap.set([tv1Ref.current, tv2Ref.current, tv3Ref.current], {
        y: -260,
        opacity: 0,
      })

      const tl = gsap.timeline({ delay: 0.4 })

      tl.to(tv1Ref.current, {
        y: 0, opacity: 1,
        duration: 1.1,
        ease: 'back.out(1.4)',
      })

      tl.to(
        [tv2Ref.current, tv3Ref.current],
        { y: 0, opacity: 1, duration: 1.0, ease: 'back.out(1.4)' },
        '-=0.5'
      )
    })

    return () => ctx.revert()
  }, [ready])

  return { tv1Ref, tv2Ref, tv3Ref }
}
