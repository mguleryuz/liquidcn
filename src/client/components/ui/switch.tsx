'use client'

import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as React from 'react'

import { cn } from '../../../utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'glass glass-sm peer relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-white/30 bg-white/20 shadow-sm transition-all outline-none data-[state=checked]:bg-primary/80 data-[state=checked]:border-primary/50 focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <span className="glass-layers glass-refraction glass-tint-none" aria-hidden="true" />
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none relative z-10 block size-5 rounded-full bg-white/90 border border-white/50 shadow-md ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:bg-white'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
