'use client'

import { ReactLenis } from 'lenis/react'
import { ReactNode } from 'react'

export function SmoothScrolling({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 0.8,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1,
        autoRaf: true
      }}
    >
      {children}
    </ReactLenis>
  )
}
