'use client'
import { PixelTV } from './PixelTV'
import { usePodiumAnimation } from '@/hooks/usePodiumAnimation'
import { TOP_3 } from '@/lib/dummy-data'

export function PodiumTVs() {
  const { tv1Ref, tv2Ref, tv3Ref } = usePodiumAnimation()

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
          student={TOP_3[1]}
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
          student={TOP_3[0]}
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
          student={TOP_3[2]}
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
