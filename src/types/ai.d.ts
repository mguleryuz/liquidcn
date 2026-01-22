/**
 * @description Type declarations for the optional 'ai' package
 * These types are used when the ai package is not installed
 */

declare module 'ai' {
  export interface TranscribeResult {
    text: string
    segments?: Array<{
      text: string
      startSecond: number
      endSecond: number
    }>
    durationInSeconds?: number
    language?: string
  }

  export interface TranscribeOptions {
    model: unknown
    audio: Uint8Array
    providerOptions?: Record<string, unknown>
  }

  export function experimental_transcribe(options: TranscribeOptions): Promise<TranscribeResult>
}
