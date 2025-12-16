'use client'

import type { ToasterProps } from 'sonner'
import { Toaster as Sonner } from 'sonner'

const Toaster = ({ ...props }: ToasterProps & { theme?: 'light' | 'dark' | 'system' }) => {
  const { theme = 'system' } = props

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{ className: 'liquid-glass' }}
      {...props}
    />
  )
}

export { Toaster }
