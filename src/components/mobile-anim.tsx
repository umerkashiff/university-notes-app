'use client'

import React, { useState, useEffect, useRef } from 'react'

export type AnimType = 'dropdown' | 'popover' | 'modal' | 'screen' | 'backdrop'

const DURATION: Record<AnimType, { enter: number; exit: number }> = {
  screen:   { enter: 180, exit: 120 },
  dropdown: { enter: 150, exit: 100 },
  popover:  { enter: 150, exit: 100 },
  modal:    { enter: 200, exit: 150 },
  backdrop: { enter: 160, exit: 150 },
}

interface MobilePresenceProps extends React.HTMLAttributes<HTMLDivElement> {
  show: boolean
  type?: AnimType
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onExitComplete?: () => void
}

export function MobilePresence({
  show,
  type = 'dropdown',
  children,
  className = '',
  style,
  onExitComplete,
  ...rest
}: MobilePresenceProps) {
  const [mounted, setMounted] = useState(show)
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevShowRef = useRef(show)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (show && !prevShowRef.current) {
      setMounted(true)
      setPhase('enter')
    } else if (!show && prevShowRef.current) {
      setPhase('exit')
      timerRef.current = setTimeout(() => {
        setMounted(false)
        onExitComplete?.()
      }, DURATION[type].exit)
    }

    prevShowRef.current = show

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [show, type, onExitComplete])

  if (!mounted) return null

  const animClass = phase === 'enter' ? `m-${type}-enter` : `m-${type}-exit`

  return (
    <div
      className={`${className} ${animClass}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </div>
  )
}
