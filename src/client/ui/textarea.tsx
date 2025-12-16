import * as React from 'react'

import { cn } from '../utils'

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
          'placeholder:text-white/70 bg-black/20 border border-white/50 flex field-sizing-content min-h-16 w-full rounded-md px-3 py-2 text-white transition-all duration-300 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
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
        'glass glass-lg relative border border-white/50 min-h-16 w-full rounded-md text-white transition-all duration-300',
        'focus-within:ring-2 focus-within:ring-white/50',
        className
      )}
    >
      <span
        className="glass-layers glass-refraction glass-texture glass-tint-none"
        aria-hidden="true"
      />
      <textarea
        data-slot="textarea"
        className="placeholder:text-white/70 bg-transparent flex field-sizing-content min-h-16 w-full px-3 py-2 text-white outline-none md:text-sm disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive relative z-10"
        {...props}
      />
    </div>
  )
}

export { Textarea }
