import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../utils'

const badgeVariants = cva(
  'rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow]',
  {
    variants: {
      variant: {
        default:
          'border-foreground/20 bg-foreground/5 text-foreground [a&]:hover:bg-foreground/10 dark:border-foreground/30 dark:bg-foreground/10 dark:[a&]:hover:bg-foreground/15',
        primary:
          'border-primary/30 bg-primary/10 text-primary [a&]:hover:bg-primary/15 dark:border-primary/40 dark:bg-primary/15 dark:[a&]:hover:bg-primary/20',
        secondary:
          'border-foreground/15 bg-foreground/5 text-muted-foreground [a&]:hover:bg-foreground/8 dark:border-foreground/25 dark:bg-foreground/8 dark:[a&]:hover:bg-foreground/12',
        destructive:
          'border-destructive/30 bg-destructive/10 text-destructive [a&]:hover:bg-destructive/15 dark:border-destructive/40 dark:bg-destructive/15 dark:[a&]:hover:bg-destructive/20',
        outline:
          'border-foreground/30 bg-background/50 text-foreground [a&]:hover:bg-foreground/5 dark:border-foreground/40 dark:bg-background/30 dark:[a&]:hover:bg-foreground/10',
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
