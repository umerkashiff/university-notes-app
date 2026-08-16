'use client'

import { ReactLenis } from 'lenis/react'
import { ReactNode, useState, useEffect } from 'react'

export function SmoothScrolling({ children }: { children: ReactNode }) {
  // Disable Lenis entirely on touch devices.
  // Even with syncTouch:false, the RAF loop runs and can interfere with
  // CSS transition timing on iOS. Native touch scrolling is superior anyway.
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  }, [])

  if (isTouch) return <>{children}</>

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

