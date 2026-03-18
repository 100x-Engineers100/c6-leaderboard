'use client'
import { useState, useEffect } from 'react'
import type { Student } from '@/lib/types'
import { PixelTV } from './PixelTV'
import { usePodiumAnimation } from '@/hooks/usePodiumAnimation'

type Props = { top3: Student[] }

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max)

const props = (f: number) => ({
  frameSize:      f,
  medalSize:      Math.round(f * 0.65),
  medalMarginTop: -Math.round(f * 0.06),
  nameSize:       Math.round(f * 0.10),
  pointsSize:     Math.round(f * 0.065),
  moveUpwards:    -Math.round(f * 0.08),
  innerPadding:   Math.round(f * 0.08),
})

export function PodiumTVs({ top3 }: Props) {
  const s1 = top3[0]
  const s2 = top3[1]
  const s3 = top3[2]
  const ready = !!(s1 && s2 && s3)

  const [vp, setVp] = useState({ vw: 1440, vh: 900 })
  useEffect(() => {
    const update = () => setVp({ vw: window.innerWidth, vh: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { tv1Ref, tv2Ref, tv3Ref } = usePodiumAnimation(ready)

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        flex: 1,
      }} />
    )
  }

  const isMobile = vp.vw < 640

  if (isMobile) {
    const avH = vp.vh - 185
    const rowH = avH * 0.50
    const centerFrame = clamp(Math.min(vp.vw * 0.42, rowH * 0.60), 100, 165)
    const sideFrame   = clamp(Math.min(vp.vw * 0.34, rowH * 0.52), 80,  135)

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 0,
      }}>
        {/* #1 -- top, prominent */}
        <PixelTV
          student={s1}
          rank={1}
          frameRef={tv1Ref}
          {...props(centerFrame)}
        />
        {/* #2 and #3 side by side */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
          <PixelTV
            student={s2}
            rank={2}
            frameRef={tv2Ref}
            {...props(sideFrame)}
          />
          <PixelTV
            student={s3}
            rank={3}
            frameRef={tv3Ref}
            {...props(sideFrame)}
          />
        </div>
      </div>
    )
  }

  const avH = vp.vh - 160
  const centerFrame = clamp(Math.min(vp.vw * 0.22, avH * 0.58), 180, 300)
  const sideFrame   = clamp(Math.min(vp.vw * 0.18, avH * 0.47), 150, 260)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      flex: 1,
    }}>
      {/* #2 -- left */}
      <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 -20px' }}>
        <PixelTV
          student={s2}
          rank={2}
          frameRef={tv2Ref}
          {...props(sideFrame)}
        />
      </div>

      {/* #1 -- center */}
      <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, margin: '0 20px' }}>
        <PixelTV
          student={s1}
          rank={1}
          frameRef={tv1Ref}
          {...props(centerFrame)}
        />
      </div>

      {/* #3 -- right */}
      <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 -20px' }}>
        <PixelTV
          student={s3}
          rank={3}
          frameRef={tv3Ref}
          {...props(sideFrame)}
        />
      </div>
    </div>
  )
}
