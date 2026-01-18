'use client'

import { Loader2, Send, Sparkles } from 'lucide-react'
import * as React from 'react'
import type { AIFormMessage } from 'tanstack-effect'

import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../utils'

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
 * @description Full chat UI for AI form filling
 */
export function ChatView({
  messages,
  status,
  onSend,
  className,
  placeholder = 'Describe what you want to fill in...',
}: ChatViewProps) {
  const [input, setInput] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-11 max-h-32 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
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
