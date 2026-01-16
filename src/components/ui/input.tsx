import * as React from 'react'

import { cn } from '../../utils'

interface InputProps extends React.ComponentProps<'input'> {
  /**
   * Disable the liquid glass effect
   */
  noGlass?: boolean
}

function Input({ className, type, noGlass = false, ...props }: InputProps) {
  if (noGlass) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-md px-3 py-1 transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'text-foreground bg-foreground/5 border border-foreground/20',
          'dark:bg-foreground/10 dark:border-foreground/30',
          'focus:outline-none focus:ring-2 focus:ring-foreground/30 focus-visible:ring-foreground/30 focus-visible:ring-2',
          'dark:focus:ring-foreground/40 dark:focus-visible:ring-foreground/40',
          'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
          className
        )}
        {...props}
      />
    )
  }

  return (
    <div
      className={cn(
        'glass glass-lg relative h-9 w-full min-w-0 rounded-md transition-all duration-300',
        'border border-foreground/20 text-foreground',
        'dark:border-foreground/30',
        'focus-within:ring-2 focus-within:ring-foreground/30 dark:focus-within:ring-foreground/40',
        className
      )}
    >
      <span
        className="glass-layers glass-refraction glass-texture glass-tint-none"
        aria-hidden="true"
      />
      <input
        type={type}
        data-slot="input"
        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-transparent h-full w-full px-3 py-1 text-foreground outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive relative z-10"
        {...props}
      />
    </div>
  )
}

export { Input }
