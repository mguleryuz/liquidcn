'use client'

import * as React from 'react'

import type {
  SpeechToTextErrorResponse,
  SpeechToTextRequest,
  SpeechToTextResponse,
} from '../../speech-to-text/types'

export type { SpeechToTextErrorResponse, SpeechToTextRequest, SpeechToTextResponse }

/**
 * @description Options for useSpeechToText hook
 */
export interface UseSpeechToTextOptions {
  /**
   * @description Callback when transcription succeeds
   */
  onSuccess?: (data: SpeechToTextResponse) => void
  /**
   * @description Callback when transcription fails
   */
  onError?: (error: SpeechToTextErrorResponse) => void
  /**
   * @description Custom API endpoint
   * @default '/api/speech-to-text'
   */
  endpoint?: string
}

/**
 * @description Internal state for useSpeechToText
 */
interface UseSpeechToTextState {
  data: SpeechToTextResponse | null
  error: SpeechToTextErrorResponse | null
  isLoading: boolean
}

/**
 * @description Return type for useSpeechToText hook
 */
export type UseSpeechToTextReturnType = ReturnType<typeof useSpeechToText>

/**
 * @description Hook for transcribing audio to text
 * @param options - Configuration options
 * @returns State and transcribe function
 * @example
 * const { transcribe, isLoading, data, error } = useSpeechToText({
 *   onSuccess: (result) => console.log('Transcribed:', result.text),
 *   onError: (err) => console.error('Error:', err.error),
 * })
 *
 * // Call with audio file
 * const result = await transcribe({ audio: audioFile })
 */
export const useSpeechToText = (options?: UseSpeechToTextOptions) => {
  const [state, setState] = React.useState<UseSpeechToTextState>({
    data: null,
    error: null,
    isLoading: false,
  })

  const endpoint = options?.endpoint ?? '/api/speech-to-text'

  const transcribe = React.useCallback(
    async (request: SpeechToTextRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const formData = new FormData()
        formData.append('audio', request.audio)
        if (request.language) formData.append('language', request.language)
        if (request.model) formData.append('model', request.model)

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        })

        const json = await response.json()

        if (!response.ok) {
          const error = json as SpeechToTextErrorResponse
          setState({ data: null, error, isLoading: false })
          options?.onError?.(error)
          return { data: null, error }
        }

        const data = json as SpeechToTextResponse
        setState({ data, error: null, isLoading: false })
        options?.onSuccess?.(data)
        return { data, error: null }
      } catch (err) {
        const error: SpeechToTextErrorResponse = {
          error: 'Network error',
          details: err instanceof Error ? err.message : 'Unknown error',
        }
        setState({ data: null, error, isLoading: false })
        options?.onError?.(error)
        return { data: null, error }
      }
    },
    [endpoint, options]
  )

  const reset = React.useCallback(() => {
    setState({ data: null, error: null, isLoading: false })
  }, [])

  return {
    ...state,
    transcribe,
    reset,
  }
}
