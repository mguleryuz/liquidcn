'use client'

import { Info, Loader2, Mic, MicOff, Send, Sparkles } from 'lucide-react'
import * as React from 'react'
import type { AIFormMessage } from 'tanstack-effect'

import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../utils'
import { useSpeechToText } from '../hooks/use-speech-to-text'
import { convertToWav, getExtensionForMimeType, getSupportedMimeType } from '../utils/audio-utils'
import { AudioVisualizer } from './audio-visualizer'

/**
 * @description Props for ChatView component
 */
export interface ChatViewProps {
  /**
   * @description Messages in the conversation
   */
  messages: AIFormMessage[]
  /**
   * @description Current status of AI
   */
  status: 'idle' | 'filling' | 'clarifying' | 'complete' | 'error'
  /**
   * @description Callback to send a message
   */
  onSend: (message: string) => void
  /**
   * @description Optional className for container
   */
  className?: string
  /**
   * @description Placeholder text for input
   */
  placeholder?: string
  /**
   * @description Enable voice input (requires OPENAI_API_KEY on server)
   * Developer must explicitly enable this when they've configured the API key
   * @default false
   */
  enableVoice?: boolean
  /**
   * @description Custom endpoint for speech-to-text API
   * @default '/api/speech-to-text'
   */
  voiceEndpoint?: string
  /**
   * @description Maximum height for the messages container
   * When reached, the container will scroll
   * @example '400px', '50vh'
   */
  maxHeight?: string
}

/**
 * @description Simple markdown renderer for chat messages
 * Supports: **bold**, *italic*, bullet points, and line breaks
 */
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')

  return lines.map((line, lineIndex) => {
    // Check if it's a bullet point
    const bulletMatch = line.match(/^(\s*)(•|-)\s*(.*)$/)

    let content: React.ReactNode

    if (bulletMatch) {
      const [, indent, , bulletContent] = bulletMatch
      content = (
        <span>
          {indent}• {renderInlineMarkdown(bulletContent)}
        </span>
      )
    } else {
      content = renderInlineMarkdown(line)
    }

    return (
      <React.Fragment key={lineIndex}>
        {lineIndex > 0 && <br />}
        {content}
      </React.Fragment>
    )
  })
}

/**
 * @description Render inline markdown (bold, italic)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyCounter = 0

  // Process **bold** and *italic*
  while (remaining.length > 0) {
    // Look for **bold**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/)
    // Look for *italic* (but not **)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/)

    let firstMatch: { match: RegExpMatchArray; type: 'bold' | 'italic' } | null = null

    if (boldMatch && italicMatch) {
      // Use whichever comes first
      if ((boldMatch.index ?? Infinity) <= (italicMatch.index ?? Infinity)) {
        firstMatch = { match: boldMatch, type: 'bold' }
      } else {
        firstMatch = { match: italicMatch, type: 'italic' }
      }
    } else if (boldMatch) {
      firstMatch = { match: boldMatch, type: 'bold' }
    } else if (italicMatch) {
      firstMatch = { match: italicMatch, type: 'italic' }
    }

    if (firstMatch && firstMatch.match.index !== undefined) {
      // Add text before the match
      if (firstMatch.match.index > 0) {
        parts.push(remaining.slice(0, firstMatch.match.index))
      }

      // Add the formatted text
      if (firstMatch.type === 'bold') {
        parts.push(
          <strong key={keyCounter++} className="font-semibold">
            {firstMatch.match[1]}
          </strong>
        )
      } else {
        parts.push(
          <em key={keyCounter++} className="italic">
            {firstMatch.match[1]}
          </em>
        )
      }

      remaining = remaining.slice(firstMatch.match.index + firstMatch.match[0].length)
    } else {
      // No more matches, add remaining text
      parts.push(remaining)
      break
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

/**
 * @description Message bubble component
 */
function MessageBubble({ message, isUser }: { message: AIFormMessage; isUser: boolean }) {
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-muted-foreground rounded-bl-md'
        )}
      >
        <div className="whitespace-pre-wrap wrap-break-word">{renderMarkdown(message.content)}</div>
        {message.timestamp && (
          <span className="mt-1 block text-[10px] opacity-60">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * @description Full chat UI for AI form filling with optional voice input
 * @example
 * <ChatView
 *   messages={messages}
 *   status={status}
 *   onSend={handleSend}
 *   enableVoice={true}  // Enable when OPENAI_API_KEY is configured
 * />
 */
export function ChatView({
  messages,
  status,
  onSend,
  className,
  placeholder = 'Describe what you want to fill in...',
  enableVoice = false,
  voiceEndpoint = '/api/speech-to-text',
  maxHeight,
}: ChatViewProps) {
  const [input, setInput] = React.useState('')
  const messagesContainerRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Voice recording state
  const [isRecording, setIsRecording] = React.useState(false)
  const [isProcessingAudio, setIsProcessingAudio] = React.useState(false)
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])

  // Speech-to-text hook
  const { transcribe, isLoading: isTranscribing } = useSpeechToText({
    endpoint: voiceEndpoint,
    onSuccess: (data) => {
      if (data.text.trim()) {
        // Append transcribed text to input
        setInput((prev) => (prev ? `${prev} ${data.text}` : data.text))
        textareaRef.current?.focus()
      }
    },
  })

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  // Scroll to bottom on initial mount (instant, no animation)
  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  // Start recording
  const startRecording = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Detect supported audio format (Safari doesn't support webm)
      const mimeType = getSupportedMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Clear recorder state after it's fully stopped
        setMediaRecorder(null)

        // Create audio file from chunks
        if (audioChunksRef.current.length > 0) {
          setIsProcessingAudio(true)
          try {
            const actualMimeType = recorder.mimeType || mimeType || 'audio/webm'
            const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType })

            // Convert to WAV for maximum compatibility with OpenAI transcription
            // This ensures iOS/Safari recordings work correctly
            let audioFile: File
            try {
              const wavBlob = await convertToWav(audioBlob)
              audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' })
            } catch (conversionError) {
              // Fallback to original format if conversion fails
              console.warn('WAV conversion failed, using original format:', conversionError)
              const extension = getExtensionForMimeType(actualMimeType)
              audioFile = new File([audioBlob], `recording.${extension}`, { type: actualMimeType })
            }

            // Transcribe the audio
            await transcribe({ audio: audioFile })
          } finally {
            setIsProcessingAudio(false)
          }
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [transcribe])

  // Stop recording
  const stopRecording = React.useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    setIsRecording(false)
    // Note: setMediaRecorder(null) is now called in onstop callback
    // to avoid race conditions
  }, [mediaRecorder])

  // Toggle recording
  const toggleRecording = React.useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  const handleSend = () => {
    if (input.trim() && status !== 'filling') {
      onSend(input.trim())
      setInput('')
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isLoading = status === 'filling'
  const hasMessages = messages.length > 0
  const isVoiceProcessing = isRecording || isProcessingAudio || isTranscribing

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-3 text-primary/50" />
            <p className="text-sm font-medium">AI Form Assistant</p>
            <p className="text-xs mt-1">
              Describe what you want to fill and I&apos;ll help you complete the form.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} isUser={message.role === 'user'} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Hint to review and save */}
      {hasMessages && !isLoading && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t bg-muted/30 text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs">
            Switch to <strong>Edit</strong> tab to review, then <strong>Save</strong> to apply
            changes
          </span>
        </div>
      )}

      {/* Voice recording indicator */}
      {enableVoice && isRecording && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 border-t bg-muted/50">
          <AudioVisualizer
            isRecording={isRecording}
            mediaRecorder={mediaRecorder}
            width={200}
            height={40}
            barColor="hsl(var(--primary))"
          />
          <span className="text-xs text-muted-foreground">Recording...</span>
        </div>
      )}

      {/* Processing/Transcribing indicator */}
      {enableVoice && (isProcessingAudio || isTranscribing) && !isRecording && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">
            {isProcessingAudio ? 'Processing audio...' : 'Transcribing...'}
          </span>
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          {/* Voice button */}
          {enableVoice && (
            <Button
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing}
              size="icon"
              variant={isRecording ? 'destructive' : 'outline'}
              className="shrink-0"
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || isVoiceProcessing}
            className="min-h-11 max-h-32 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isVoiceProcessing}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
