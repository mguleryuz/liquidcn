'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as React from 'react'

import { cn } from '../../../utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'glass glass-sm peer relative inline-flex h-6 w-11 shrink-0 items-center rounded-full shadow-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50',
        'border border-foreground/20 bg-foreground/10',
        'dark:border-foreground/30 dark:bg-foreground/20',
        'data-[state=checked]:bg-primary/70 data-[state=checked]:border-primary/40',
        'dark:data-[state=checked]:bg-primary/80 dark:data-[state=checked]:border-primary/50',
        'focus-visible:ring-2 focus-visible:ring-foreground/30 dark:focus-visible:ring-foreground/40',
        className
      )}
      {...props}
    >
      <span className="glass-layers glass-refraction glass-tint-none" aria-hidden="true" />
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none relative z-10 block size-5 rounded-full shadow-md ring-0 transition-transform',
          'bg-background border border-foreground/20',
          'dark:bg-foreground/90 dark:border-foreground/40',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
          'data-[state=checked]:bg-background dark:data-[state=checked]:bg-white'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
