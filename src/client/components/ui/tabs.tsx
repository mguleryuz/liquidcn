'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'

import { cn } from '../../../utils'

function Tabs({
  responsive,
  className,
  queryKey,
  defaultValue,
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  responsive?: boolean
  queryKey?: string
}) {
  // Get initial value from URL if queryKey is provided
  const getInitialValue = React.useCallback(() => {
    if (typeof window === 'undefined' || !queryKey) return defaultValue
    const params = new URLSearchParams(window.location.search)
    return params.get(queryKey) || defaultValue
  }, [queryKey, defaultValue])

  const [internalValue, setInternalValue] = React.useState(getInitialValue)

  // Sync with URL on mount and popstate (browser back/forward)
  React.useEffect(() => {
    if (!queryKey) return

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const urlValue = params.get(queryKey) || defaultValue
      setInternalValue(urlValue)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [queryKey, defaultValue])

  const handleValueChange = React.useCallback(
    (value: string) => {
      // Update internal state immediately for instant UI response
      setInternalValue(value)

      // Update URL if queryKey is provided
      if (queryKey && typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set(queryKey, value)
        window.history.replaceState({}, '', url.toString())
      }

      // Call controlled handler if provided
      controlledOnValueChange?.(value)
    },
    [queryKey, controlledOnValueChange]
  )

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-responsive={responsive ? '' : undefined}
      className={cn(
        'flex flex-col gap-2',
        responsive &&
          '[&_[data-slot=tabs-list-wrapper]]:h-max [&_[data-slot=tabs-list-wrapper]]:w-full',
        responsive && '[&_[role="tab"]]:flex-1',
        className
      )}
      value={value}
      onValueChange={handleValueChange}
      {...props}
    />
  )
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <div
      data-slot="tabs-list-wrapper"
      className={cn(
        'glass glass-md relative text-muted-foreground h-10 w-fit rounded-lg border border-foreground/30 p-[3px]',
        className
      )}
    >
      <span
        className="glass-layers glass-refraction glass-texture glass-tint-none"
        aria-hidden="true"
      />
      <TabsPrimitive.List
        data-slot="tabs-list"
        className="inline-flex items-center justify-center h-full w-full relative z-10"
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    </div>
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative z-10",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
