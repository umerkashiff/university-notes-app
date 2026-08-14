/**
 * FilterChip — Noota-style horizontal filter tabs
 */
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  count?: number
  active?: boolean
  onClick?: () => void
}

export function FilterChip({ label, count, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn(
          'text-xs rounded-full px-1.5 py-0.5 font-bold leading-none',
          active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-border text-muted-foreground'
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
