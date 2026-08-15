import React from 'react'

interface LogoProps {
  size?: number
  className?: string
  alt?: string
}

/**
 * Semstack Brand Logo Component
 * Easily switchable and revertable between the custom SVG and icon fallback.
 */
export function SemstackLogo({ size = 22, className = '', alt = 'Semstack' }: LogoProps) {
  return (
    <img
      src="/final.svg"
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 select-none object-contain rounded-full ${className}`}
      draggable={false}
    />
  )
}
