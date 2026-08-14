/**
 * PillInput — Mirello-style pill-shaped input field
 */
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface PillInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
}

export const PillInput = forwardRef<HTMLInputElement, PillInputProps>(
  ({ className, label, icon, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground/70 pl-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              'w-full bg-card border border-border rounded-full py-3.5 text-sm font-medium text-foreground',
              'placeholder:text-muted-foreground/60',
              'outline-none transition-all duration-200',
              'focus:border-primary/40 focus:bg-card focus:shadow-[0_0_0_3px_rgba(17,24,68,0.06)]',
              icon ? 'pl-11 pr-5' : 'px-5',
              className
            )}
            {...props}
          />
        </div>
      </div>
    )
  }
)
PillInput.displayName = 'PillInput'
