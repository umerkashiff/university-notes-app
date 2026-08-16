'use client'
import { useState, useEffect } from 'react'

/**
 * Returns true when running on a touch/mobile device.
 * SSR-safe: always returns false on server, updates after hydration.
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    setIsTouch(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  }, [])
  return isTouch
}
