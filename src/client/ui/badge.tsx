import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../utils'

const badgeVariants = cva(
  'rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow]',
  {
    variants: {
      variant: {
        default: 'border-white/40 bg-white/10 text-white [a&]:hover:bg-white/15',
        primary: 'border-primary/40 bg-primary/10 text-primary [a&]:hover:bg-primary/15',
        secondary: 'border-white/40 bg-white/8 text-white/90 [a&]:hover:bg-white/12',
        destructive: 'border-white/40 bg-white/10 text-destructive [a&]:hover:bg-white/15',
        outline: 'border-white/50 bg-black/20 text-white [a&]:hover:bg-black/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(
        badgeVariants({ variant }),
        'glass glass-sm relative inline-flex items-center justify-center gap-1',
        className
      )}
      {...props}
    >
      <span
        className="glass-layers glass-refraction glass-texture glass-tint-none"
        aria-hidden="true"
      />
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants }
