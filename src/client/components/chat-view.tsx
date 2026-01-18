'use client'

import { Loader2, Send, Sparkles } from 'lucide-react'
import * as React from 'react'
import type { AIFormMessage, ClarificationQuestion } from 'tanstack-effect'

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
   * @description Clarification questions from AI
   */
  clarifications: ClarificationQuestion[]
  /**
   * @description Current status of AI
   */
  status: 'idle' | 'filling' | 'clarifying' | 'complete' | 'error'
  /**
   * @description Summary of last AI action
   */
  summary: string | null
  /**
   * @description Callback to send a message
   */
  onSend: (message: string) => void
  /**
   * @description Callback to answer a clarification
   */
  onAnswer: (field: string, value: unknown) => void
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
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
 * @description Clarification question component
 */
function ClarificationCard({
  clarification,
  onAnswer,
}: {
  clarification: ClarificationQuestion
  onAnswer: (field: string, value: unknown) => void
}) {
  const [textValue, setTextValue] = React.useState('')

  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-muted p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{clarification.question}</span>
        </div>

        {clarification.type === 'choice' && clarification.options && (
          <div className="flex flex-wrap gap-2">
            {clarification.options.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => onAnswer(clarification.field, option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {clarification.type === 'multiselect' && clarification.options && (
          <div className="flex flex-wrap gap-2">
            {clarification.options.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => onAnswer(clarification.field, option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {clarification.type === 'text' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textValue.trim()) {
                  onAnswer(clarification.field, textValue.trim())
                  setTextValue('')
                }
              }}
              placeholder="Type your answer..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (textValue.trim()) {
                  onAnswer(clarification.field, textValue.trim())
                  setTextValue('')
                }
              }}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
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
  clarifications,
  status,
  summary,
  onSend,
  onAnswer,
  className,
  placeholder = 'Describe what you want to fill in...',
}: ChatViewProps) {
  const [input, setInput] = React.useState('')
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, clarifications])

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

        {/* Show clarification questions */}
        {clarifications.map((clarification, index) => (
          <ClarificationCard
            key={`clarification-${index}`}
            clarification={clarification}
            onAnswer={onAnswer}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Summary badge */}
        {summary && status === 'complete' && (
          <div className="flex w-full justify-center">
            <div className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs text-primary">
              {summary}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-[44px] w-[44px]"
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
