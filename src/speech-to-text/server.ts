/**
 * @description Server-side speech-to-text handler
 * Used by SDK consumers in their API routes
 *
 * @note This module requires optional peer dependencies: 'ai' and '@ai-sdk/openai'.
 * Install them with: bun add ai @ai-sdk/openai
 */

import type {
  SpeechToTextErrorResponse,
  SpeechToTextHandlerOptions,
  SpeechToTextResponse,
  TranscriptionModel,
} from './types'

const DEFAULT_MODEL: TranscriptionModel = 'gpt-4o-transcribe'

/**
 * @description Core function to transcribe audio using OpenAI
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

  // Dynamic imports to avoid bundler errors when optional deps are not installed
  const [{ openai }, { experimental_transcribe: transcribe }] = await Promise.all([
    import('@ai-sdk/openai'),
    import('ai'),
  ])

  const result = await transcribe({
    model: openai.transcription(model),
    audio: audioData,
    providerOptions: {
      openai: {
        ...(options?.language && { language: options.language }),
        timestampGranularities: ['segment'],
      },
    },
  })

  return {
    text: result.text,
    segments: result.segments,
    duration: result.durationInSeconds,
    language: result.language,
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
