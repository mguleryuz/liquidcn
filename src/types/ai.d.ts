/**
 * @description Type declarations for Bun test
 */

declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void
  export function it(name: string, fn: () => void | Promise<void>): void
  export function expect<T>(value: T): {
    toBe(expected: unknown): void
    toEqual(expected: unknown): void
    toBeTruthy(): void
    toBeFalsy(): void
    toBeDefined(): void
    toBeUndefined(): void
    toBeNull(): void
    toContain(expected: unknown): void
    toContainEqual(expected: unknown): void
    toHaveLength(expected: number): void
    toHaveProperty(expected: unknown): void
    toMatch(expected: unknown): void
    toMatchObject(expected: unknown): void
    toThrow(expected?: unknown): void
    toBeInstanceOf(expected: unknown): void
    toHaveReturned(): void
    toHaveReturnedTimes(expected: number): void
    toHaveReturnedWith(expected: unknown): void
    toHaveLastReturnedWith(expected: unknown): void
    toHaveNthReturnedWith(n: number, expected: unknown): void
  }
}

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

  // Embedding types
  export interface EmbedResult {
    embedding: number[]
  }

  export interface EmbedManyResult {
    embeddings: number[][]
  }

  export function embed<T>(options: unknown): Promise<EmbedResult>
  export function embedMany<T>(options: unknown): Promise<EmbedManyResult>
}
