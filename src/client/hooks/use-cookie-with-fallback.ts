import { useCallback, useEffect, useState } from 'react'

/**
 * Check if the app is running in an iframe (e.g., Farcaster, Warpcast)
 */
function isInIframe(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.self !== window.top
  } catch {
    // If accessing window.top throws an error due to cross-origin restrictions,
    // we're definitely in an iframe
    return true
  }
}

/**
 * Check if we're in a secure context (HTTPS)
 */
function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}

interface CookieOptions {
  /** Expiry time in days */
  days: number
}

/**
 * Hook for managing preferences with cookie + localStorage fallback for iframe compatibility
 *
 * Supports iframe environments (Farcaster, Warpcast) by:
 * - Using SameSite=None cookies in secure iframe contexts
 * - Falling back to localStorage when cookies are blocked
 * - Automatically detecting iframe environment
 */
export function useCookieWithFallback(cookieName: string, localStorageKey: string) {
  const [value, setValue] = useState<string | null>(null)

  const getPreference = useCallback((): string | null => {
    if (typeof window === 'undefined') return null

    const inIframe = isInIframe()

    try {
      // In iframe environments, prioritize localStorage
      if (inIframe) {
        const storageValue = localStorage.getItem(localStorageKey)
        if (storageValue !== null) return storageValue
      }

      // Try to get from cookie
      const nameEQ = cookieName + '='
      const ca = document.cookie.split(';')
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
      }

      // Fallback to localStorage if cookie not found
      return localStorage.getItem(localStorageKey)
    } catch (error) {
      console.warn('Error getting preference:', error)
      return null
    }
  }, [cookieName, localStorageKey])

  const setPreference = useCallback(
    (newValue: string, options: CookieOptions) => {
      if (typeof window === 'undefined') return

      const inIframe = isInIframe()
      const secure = isSecureContext()

      try {
        // Always try localStorage first for iframe environments
        if (inIframe) {
          localStorage.setItem(localStorageKey, newValue)
        }

        // Try to set cookie with appropriate SameSite policy
        const expires = new Date()
        expires.setTime(expires.getTime() + options.days * 24 * 60 * 60 * 1000)

        if (inIframe && secure) {
          // For iframe in secure context, use SameSite=None with Secure flag
          document.cookie = `${cookieName}=${newValue};expires=${expires.toUTCString()};path=/;SameSite=None;Secure`
        } else if (inIframe) {
          // For iframe in non-secure context, fallback to localStorage only
          localStorage.setItem(localStorageKey, newValue)
        } else {
          // For non-iframe context, use SameSite=Lax
          document.cookie = `${cookieName}=${newValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`
        }

        setValue(newValue)
      } catch (error) {
        // If cookie setting fails, fallback to localStorage
        console.warn('Cookie setting failed, using localStorage:', error)
        try {
          localStorage.setItem(localStorageKey, newValue)
          setValue(newValue)
        } catch (storageError) {
          console.error('Both cookie and localStorage failed:', storageError)
        }
      }
    },
    [cookieName, localStorageKey]
  )

  const deletePreference = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      // Clear from localStorage
      localStorage.removeItem(localStorageKey)

      // Clear from cookie
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`

      // Also try with SameSite=None for iframe environments
      if (isInIframe() && isSecureContext()) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure`
      }

      setValue(null)
    } catch (error) {
      console.warn('Error deleting preference:', error)
    }
  }, [cookieName, localStorageKey])

  // Initialize value on mount from cookie/localStorage
  useEffect(() => {
    const initialValue = getPreference()
    setValue(initialValue)
  }, [getPreference])

  return {
    value,
    getPreference,
    setPreference,
    deletePreference,
  }
}
