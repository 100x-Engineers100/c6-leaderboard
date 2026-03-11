'use client'
import { PixelTV } from './PixelTV'
import { usePodiumAnimation } from '@/hooks/usePodiumAnimation'
import { TOP_3 } from '@/lib/dummy-data'

export function PodiumTVs() {
  const { tv1Ref, tv2Ref, tv3Ref } = usePodiumAnimation()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 72,
      padding: '0 16px',
    }}>
      {/* #2 — left */}
      <div ref={tv2Ref}>
        <PixelTV student={TOP_3[1]} rank={2} size="md" />
      </div>

      {/* #1 — center, taller */}
      <div ref={tv1Ref}>
        <PixelTV student={TOP_3[0]} rank={1} size="lg" />
      </div>

      {/* #3 — right */}
      <div ref={tv3Ref}>
        <PixelTV student={TOP_3[2]} rank={3} size="md" />
      </div>
    </div>
  )
}
