/**
 * @description Server-side speech-to-text handler
 * Used by SDK consumers in their API routes
 *
 * @note This module requires optional dependencies: 'ai' and '@ai-sdk/openai'.
 * Install them with: bun add ai @ai-sdk/openai
 */

import { openai } from '@ai-sdk/openai'
import { experimental_transcribe as transcribe } from 'ai'

import type {
  SpeechToTextErrorResponse,
  SpeechToTextHandlerOptions,
  SpeechToTextResponse,
  TranscriptionModel,
} from './types'

const DEFAULT_MODEL: TranscriptionModel = 'gpt-4o-transcribe'

/**
 * @description Transcribe audio using streaming via direct OpenAI API call.
 * Collects streamed transcript events and returns the full text.
 */
async function transcribeStreaming(
  audioData: Uint8Array,
  options?: { model?: TranscriptionModel; language?: string }
): Promise<SpeechToTextResponse> {
  const model = options?.model || DEFAULT_MODEL
  const formData = new FormData()
  const audioFile = new File([Buffer.from(audioData)], 'audio.wav', { type: 'audio/wav' })
  formData.append('file', audioFile)
  formData.append('model', model)
  formData.append('stream', 'true')
  formData.append('response_format', 'text')
  if (options?.language) formData.append('language', options.language)

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`OpenAI streaming transcription failed: ${response.status}`)
  }

  // Collect streamed text chunks
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body for streaming transcription')

  const decoder = new TextDecoder()
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    // SSE format: parse "data: {...}" lines
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const parsed = JSON.parse(line.slice(6))
          if (parsed.text) text += parsed.text
        } catch {
          // Plain text streaming - append directly
          text += line.slice(6)
        }
      }
    }
  }

  return { text: text.trim() }
}

/**
 * @description Core function to transcribe audio using OpenAI
 * Uses lightweight compression formatting (no segments/timestamps) for minimal response size.
 * Falls back to streaming if the standard call fails.
 * @param audioData - Audio data as Uint8Array
 * @param options - Transcription options
 * @returns Transcription result
 * @throws Error if 'ai' or '@ai-sdk/openai' packages are not installed
 */
export async function transcribeAudio(
  audioData: Uint8Array,
  options?: {
    model?: TranscriptionModel
    language?: string
  }
): Promise<SpeechToTextResponse> {
  const model = options?.model || DEFAULT_MODEL

  try {
    // Lightweight compression formatting: no timestampGranularities, just text output
    const result = await transcribe({
      model: openai.transcription(model),
      audio: audioData,
      providerOptions: {
        openai: {
          ...(options?.language && { language: options.language }),
        },
      },
    })

    return {
      text: result.text,
      language: result.language,
    }
  } catch {
    // Fallback: use streaming transcription via direct API call
    return transcribeStreaming(audioData, options)
  }
}

/**
 * @description Create a speech-to-text API handler for Next.js/Express routes
 * @param options - Handler configuration options
 * @returns Request handler function
 * @example
 * // Next.js App Router
 * import { createSpeechToTextHandler } from 'liquidcn'
 * import { auth } from '@/auth'
 *
 * const handler = createSpeechToTextHandler({
 *   authenticate: async () => {
 *     const session = await auth()
 *     return !!session?.user
 *   }
 * })
 *
 * export const POST = handler
 */
export function createSpeechToTextHandler(options?: SpeechToTextHandlerOptions) {
  return async (req: Request): Promise<Response> => {
    try {
      // Check for API key
      if (!process.env.OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({
            error: 'Missing OPENAI_API_KEY environment variable',
          } satisfies SpeechToTextErrorResponse),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Handle authentication if provided
      if (options?.authenticate) {
        const isAuthenticated = await options.authenticate(req)
        if (!isAuthenticated) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' } satisfies SpeechToTextErrorResponse),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      // Parse form data
      const formData = await req.formData()
      const audioFile = formData.get('audio') as File | null
      const language = (formData.get('language') as string) || undefined
      const model =
        (formData.get('model') as TranscriptionModel) || options?.defaultModel || DEFAULT_MODEL

      if (!audioFile) {
        return new Response(
          JSON.stringify({
            error: 'Audio file is required',
          } satisfies SpeechToTextErrorResponse),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Convert File to Uint8Array
      const arrayBuffer = await audioFile.arrayBuffer()
      const audioData = new Uint8Array(arrayBuffer)

      // Transcribe
      const result = await transcribeAudio(audioData, { model, language })

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Speech-to-text error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to transcribe audio',
          details: error instanceof Error ? error.message : 'Unknown error',
        } satisfies SpeechToTextErrorResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}
