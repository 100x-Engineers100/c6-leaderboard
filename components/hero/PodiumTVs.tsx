'use client'
import type { Student } from '@/lib/types'
import { PixelTV } from './PixelTV'
import { usePodiumAnimation } from '@/hooks/usePodiumAnimation'

type Props = { top3: Student[] }

export function PodiumTVs({ top3 }: Props) {
  const s1 = top3[0]
  const s2 = top3[1]
  const s3 = top3[2]
  const ready = !!(s1 && s2 && s3)

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

  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      flex: 1,
    }}>
      {/* #2 — left */}
      <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 -20px' }}>
        <PixelTV
          student={s2}
          rank={2}
          frameSize={260}
          frameRef={tv2Ref}
          medalSize={200}
          medalMarginTop={-20}
          nameSize={24}
          pointsSize={15}
          moveUpwards={-25}
        />
      </div>

      {/* #1 — center */}
      <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, margin: '0 20px' }}>
        <PixelTV
          student={s1}
          rank={1}
          frameSize={300}
          frameRef={tv1Ref}
          medalSize={180}
          medalMarginTop={-30}
          nameSize={30}
          pointsSize={18}
          moveUpwards={-25}
        />
      </div>

      {/* #3 — right */}
      <div style={{ flex: '0 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 -20px' }}>
        <PixelTV
          student={s3}
          rank={3}
          frameSize={260}
          frameRef={tv3Ref}
          medalSize={200}
          medalMarginTop={-20}
          nameSize={24}
          pointsSize={18}
          moveUpwards={-25}
        />
      </div>
    </div>
  )
}
