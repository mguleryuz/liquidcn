import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../utils'

const buttonVariants = cva(
  'cursor-pointer rounded-lg border text-sm font-semibold transition-all duration-300 align-middle select-none font-sans disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0 aria-invalid:border-destructive/60 aria-invalid:focus-visible:ring-destructive/40',
  {
    variants: {
      variant: {
        default:
          'text-primary bg-primary/10 border-primary/30 hover:bg-primary/20 focus-visible:ring-primary/50 dark:text-primary-foreground dark:bg-primary/20 dark:border-primary/40 dark:hover:bg-primary/30',
        destructive:
          'text-destructive bg-destructive/10 border-destructive/30 hover:bg-destructive/20 focus-visible:ring-destructive/50 dark:text-destructive-foreground dark:bg-destructive/25 dark:border-destructive/50 dark:hover:bg-destructive/35',
        outline:
          'text-foreground bg-foreground/5 border-foreground/30 hover:bg-foreground/10 focus-visible:ring-foreground/40 dark:bg-foreground/10 dark:border-foreground/40 dark:hover:bg-foreground/20',
        secondary:
          'text-secondary-foreground bg-secondary/15 border-secondary/30 hover:bg-secondary/25 focus-visible:ring-secondary/50 dark:bg-secondary/20 dark:border-secondary/50 dark:hover:bg-secondary/30',
        ghost:
          'text-foreground bg-transparent border-transparent shadow-none hover:bg-foreground/5 focus-visible:ring-foreground/40 dark:hover:bg-foreground/10',
        link: 'text-primary bg-transparent border-transparent shadow-none underline-offset-4 hover:underline hover:bg-transparent focus-visible:ring-0',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-xl px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /**
     * Disable the liquid glass effect
     */
    noGlass?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  noGlass = false,
  children,
  ...props
}: ButtonProps) {
  // Ghost and link variants don't need glass effect
  const shouldUseGlass = !noGlass && variant !== 'ghost' && variant !== 'link'

  // When asChild is true, we can't add extra children (Slot expects single child)
  // So we skip the glass-layers span but still apply the glass CSS classes
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size }),
          'relative inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden',
          shouldUseGlass && 'glass glass-lg',
          className
        )}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  return (
    <button
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size }),
        'relative inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden',
        shouldUseGlass && 'glass glass-lg',
        className
      )}
      {...props}
    >
      {shouldUseGlass && (
        <span
          className="glass-layers glass-refraction glass-texture glass-tint-none"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}

export { Button, buttonVariants }
