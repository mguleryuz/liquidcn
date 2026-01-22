/**
 * @description Type declarations for the optional '@ai-sdk/openai' package
 * These types are used when the @ai-sdk/openai package is not installed
 */

declare module '@ai-sdk/openai' {
  export interface OpenAIProvider {
    transcription(model: string): unknown
  }

  export const openai: OpenAIProvider
}
