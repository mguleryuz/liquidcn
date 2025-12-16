import * as React from 'react'

import { cn } from '../utils'

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
          'file:text-foreground placeholder:text-white/70 selection:bg-primary selection:text-primary-foreground bg-black/20 border border-white/50 h-9 w-full min-w-0 rounded-md px-3 py-1 text-white transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus:outline-none focus:ring-2 focus:ring-white/50 focus-visible:ring-white/50 focus-visible:ring-2',
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
        'glass glass-lg relative border border-white/50 h-9 w-full min-w-0 rounded-md text-white transition-all duration-300',
        'focus-within:ring-2 focus-within:ring-white/50',
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
        className="file:text-foreground placeholder:text-white/70 selection:bg-primary selection:text-primary-foreground bg-transparent h-full w-full px-3 py-1 text-white outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive relative z-10"
        {...props}
      />
    </div>
  )
}

export { Input }
