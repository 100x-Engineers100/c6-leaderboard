'use client'
import { useEffect, RefObject } from 'react'
import gsap from 'gsap'

// Use a native scroll listener instead of ScrollTrigger.
// Reason: ScrollTrigger needs the Lenis bridge to sync, and scale on a
// centered radial-gradient inside overflow:hidden is invisible (center
// color never changes). brightness + opacity are the visible properties.
export function useScrollGlow(glowRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = glowRef.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const SCROLL_END = 700 // px at which animation is fully complete

    const onScroll = () => {
      const progress = Math.min(window.scrollY / SCROLL_END, 1)
      // opacity 0 → 1: glow is invisible at scroll=0, fully visible at scroll=700px
      // brightness 1 → 2.5: additional punch as it fades in
      gsap.set(el, {
        opacity: progress,
        filter: `brightness(${1 + progress * 1.5})`,
      })
    }

    // Set initial state
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [glowRef])
}
