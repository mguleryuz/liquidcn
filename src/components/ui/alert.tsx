import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../utils'

const alertVariants = cva(
  'relative w-full max-w-full rounded-lg border border-foreground/30 px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default:
          'text-foreground [&>svg]:text-foreground *:data-[slot=alert-description]:text-foreground/90',
        destructive:
          'text-destructive [&>svg]:text-destructive *:data-[slot=alert-description]:text-destructive/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface AlertProps extends React.ComponentProps<'div'>, VariantProps<typeof alertVariants> {
  /**
   * Custom className for the content wrapper.
   * Use this to override the default grid layout when needed.
   */
  contentClassName?: string
  /**
   * Enable the liquid glass effect
   */
  isGlass?: boolean
}

function Alert({
  className,
  contentClassName,
  variant,
  isGlass = false,
  children,
  ...props
}: AlertProps) {
  const contentClasses = cn(
    'grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_minmax(0,1fr)] grid-cols-[0_minmax(0,1fr)] has-[>svg]:gap-x-3 gap-y-0.5 items-start relative z-10',
    contentClassName
  )

  if (!isGlass) {
    return (
      <div
        data-slot="alert"
        role="alert"
        className={cn(alertVariants({ variant }), 'bg-background', className)}
        {...props}
      >
        <div className={contentClasses}>{children}</div>
      </div>
    )
  }

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), 'glass glass-md', className)}
      {...props}
    >
      <span
        className="glass-layers glass-refraction glass-texture glass-tint-none"
        aria-hidden="true"
      />
      <div className={contentClasses}>{children}</div>
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'break-all relative z-10 col-start-2 line-clamp-1 min-h-4 min-w-0 font-medium tracking-tight',
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'break-all relative z-10 text-muted-foreground col-start-2 min-w-0 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle }
