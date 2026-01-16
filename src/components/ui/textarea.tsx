import * as React from 'react'

import { cn } from '../../utils'

interface TextareaProps extends React.ComponentProps<'textarea'> {
  /**
   * Enable the liquid glass effect
   */
  isGlass?: boolean
}

function Textarea({ className, isGlass = false, ...props }: TextareaProps) {
  if (!isGlass) {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          'placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md px-3 py-2 transition-all duration-300 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
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
        'glass glass-lg relative min-h-16 w-full rounded-md transition-all duration-300',
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
      <textarea
        data-slot="textarea"
        className="placeholder:text-muted-foreground bg-transparent flex field-sizing-content min-h-16 w-full px-3 py-2 text-foreground outline-none md:text-sm disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive relative z-10"
        {...props}
      />
    </div>
  )
}

export { Textarea }
