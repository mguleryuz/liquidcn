/**
 * @description Speech-to-text module types
 * Request/response interfaces for the transcription API
 */

/**
 * @description Supported transcription models
 */
export type TranscriptionModel = 'gpt-4o-transcribe' | 'gpt-4o-mini-transcribe' | 'whisper-1'

/**
 * @description Request body for speech-to-text API (FormData fields)
 */
export interface SpeechToTextRequest {
  /**
   * @description Audio file to transcribe
   */
  audio: File
  /**
   * @description Language code (e.g., 'en', 'es', 'fr')
   */
  language?: string
  /**
   * @description Transcription model to use
   * @default 'gpt-4o-transcribe'
   */
  model?: TranscriptionModel
}

/**
 * @description A segment of transcribed text with timestamps
 */
export interface TranscriptSegment {
  /**
   * @description Transcribed text for this segment
   */
  text: string
  /**
   * @description Start time in seconds
   */
  startSecond: number
  /**
   * @description End time in seconds
   */
  endSecond: number
}

/**
 * @description Successful response from speech-to-text API
 */
export interface SpeechToTextResponse {
  /**
   * @description Full transcribed text
   */
  text: string
  /**
   * @description Transcript segments with timestamps
   */
  segments?: TranscriptSegment[]
  /**
   * @description Total audio duration in seconds
   */
  duration?: number
  /**
   * @description Detected or specified language
   */
  language?: string
}

/**
 * @description Error response from speech-to-text API
 */
export interface SpeechToTextErrorResponse {
  /**
   * @description Error message
   */
  error: string
  /**
   * @description Additional error details
   */
  details?: string
}

/**
 * @description Options for createSpeechToTextHandler
 */
export interface SpeechToTextHandlerOptions {
  /**
   * @description Custom authentication function
   * Return true if authenticated, false otherwise
   * If not provided, no authentication is performed
   */
  authenticate?: (req: Request) => Promise<boolean> | boolean
  /**
   * @description Default model to use if not specified in request
   * @default 'gpt-4o-transcribe'
   */
  defaultModel?: TranscriptionModel
}
