import * as React from 'react'

import { cn } from '../../utils'

type GlassSize = 'sm' | 'md' | 'lg' | 'xl'
type GlassTint = 'none' | 'light' | 'default' | 'dark'

const glassSizeClasses: Record<GlassSize, string> = {
  sm: 'glass-sm',
  md: 'glass-md',
  lg: 'glass-lg',
  xl: 'glass-xl',
}

const glassTintClasses: Record<GlassTint, string> = {
  none: 'glass-tint-none',
  light: 'glass-tint-light',
  default: 'glass-tint-default',
  dark: 'glass-tint-dark',
}

interface CardProps extends React.ComponentProps<'div'> {
  /**
   * Size variant for liquid glass effect intensity
   */
  size?: GlassSize
  /**
   * Tint variant for the glass overlay
   */
  tint?: GlassTint
  /**
   * Enable the liquid glass effect
   */
  isGlass?: boolean
}

function Card({
  className,
  size = 'md',
  tint = 'none',
  isGlass = false,
  children,
  ...props
}: CardProps) {
  if (!isGlass) {
    return (
      <div
        data-slot="card"
        className={cn(
          'bg-background text-card-foreground flex flex-col gap-4 rounded-xl border py-4 border-foreground/30 overflow-hidden relative max-w-full min-w-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      data-slot="card"
      className={cn(
        'glass relative text-card-foreground rounded-xl border py-4 border-foreground/30 max-w-full min-w-0',
        glassSizeClasses[size],
        className
      )}
      {...props}
    >
      <span
        className={cn('glass-layers glass-refraction glass-texture', glassTintClasses[tint])}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col gap-4">{children}</div>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'relative z-10 @container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4',
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('relative z-10 leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('break-all relative z-10 text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'relative z-10 col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('relative z-10 px-4 min-w-0 overflow-hidden', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('relative z-10 flex items-center px-4 [.border-t]:pt-4', className)}
      {...props}
    />
  )
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
