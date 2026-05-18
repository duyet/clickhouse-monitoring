'use client'

'use no memo'

import { RefreshCwIcon, SquareIcon } from 'lucide-react'

import type { UIMessage } from 'ai'
import type { Conversation } from '@/lib/ai/agent/conversation-utils'
import type { AgentError } from '@/lib/ai/agent/errors'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AgentErrorDisplay } from '@/components/agents/agent-error-display'
import {
  AgentChatCompactControls,
  AgentChatHeader,
} from '@/components/agents/chat/controls'
import { AgentChatEmptyState } from '@/components/agents/chat/empty-state'
import {
  ChatMessage,
  StreamingTypingIndicator,
} from '@/components/agents/chat/message'
import { PromptInputTextareaWithMentions } from '@/components/agents/mentions'
import {
  ConversationContent,
  ConversationEmptyState,
  Conversation as ConversationUI,
} from '@/components/ai-elements/conversation'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { Button } from '@/components/ui/button'
import { useConversationContext } from '@/lib/ai/agent/conversation-context'
import { isAgentError } from '@/lib/ai/agent/errors'
import { getSavedModel } from '@/lib/hooks/use-agent-model'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { useHostId } from '@/lib/swr'
import { apiFetch } from '@/lib/swr/api-fetch'

export interface AgentsChatAreaRef {
  handleClear: () => void
  submitPrompt: (text: string) => void
}

interface AgentsChatAreaProps {
  readonly isSidebarOpen: boolean
  readonly onMenuClick: () => void
  readonly hideHeader?: boolean
  readonly hideCompactControls?: boolean
  readonly onMessagesChange?: (messages: readonly UIMessage[]) => void
}

function findLastAssistantMessage(messages: readonly UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'assistant') return messages[index]
  }
  return undefined
}

function findLastUserMessage(messages: readonly UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === 'user') return messages[index]
  }
  return undefined
}

function getTextPart(message: UIMessage) {
  return message.parts.find(
    (part): part is { type: 'text'; text: string } =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      part.type === 'text'
  )
}

export const AgentsChatArea = forwardRef<
  AgentsChatAreaRef,
  AgentsChatAreaProps
>(function AgentsChatArea(
  {
    isSidebarOpen,
    onMenuClick,
    hideHeader = false,
    hideCompactControls = false,
    onMessagesChange,
  }: AgentsChatAreaProps,
  ref
) {
  const hostId = useHostId()
  const { conversations, currentConversationId, updateMessages } =
    useConversationContext()
  const model = useMemo(() => getSavedModel(), [])
  const { disabledTools } = useToolConfig()

  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/v1/agent',
        fetch: apiFetch,
        body: { hostId, model, disabledTools, sessionId },
      }),
    [hostId, model, disabledTools, sessionId]
  )

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    stop,
    addToolResult,
  } = useChat({ transport })

  const sendTimestampRef = useRef<number>(0)
  const prevStatusRef = useRef<string>(status)
  const lastSavedMessagesRef = useRef<UIMessage[]>([])
  const latestMessagesRef = useRef<readonly UIMessage[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const regenerateTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const followUpRequestRef = useRef<string | undefined>(undefined)
  const prevConversationIdRef = useRef<string | undefined>(undefined)
  const [responseDurations, setResponseDurations] = useState<
    Record<string, number>
  >({})
  const [generatedFollowUps, setGeneratedFollowUps] = useState<
    Record<string, string[]>
  >({})
  const [followUpErrors, setFollowUpErrors] = useState<
    Record<string, AgentError>
  >({})
  const generatedFollowUpsRef = useRef<Record<string, string[]>>({})
  const followUpErrorsRef = useRef<Record<string, AgentError>>({})

  const isLoading = status === 'streaming' || status === 'submitted'
  const isEmpty = messages.length === 0
  const lastAssistantMessage = useMemo(
    () => findLastAssistantMessage(messages),
    [messages]
  )
  const followUpSuggestions =
    lastAssistantMessage != null
      ? (generatedFollowUps[lastAssistantMessage.id] ?? [])
      : []
  const lastAssistantMessageId = lastAssistantMessage?.id

  useEffect(() => {
    latestMessagesRef.current = messages
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  useEffect(() => {
    const previousStatus = prevStatusRef.current
    prevStatusRef.current = status

    if (
      previousStatus === 'ready' &&
      (status === 'submitted' || status === 'streaming')
    ) {
      sendTimestampRef.current = Date.now()
    }

    if (
      (previousStatus === 'streaming' || previousStatus === 'submitted') &&
      status === 'ready' &&
      sendTimestampRef.current > 0
    ) {
      const lastAssistantMessage = findLastAssistantMessage(messages)
      if (!lastAssistantMessage) return

      const duration = Date.now() - sendTimestampRef.current
      setResponseDurations((previous) => ({
        ...previous,
        [lastAssistantMessage.id]: duration,
      }))
      sendTimestampRef.current = 0
    }
  }, [status, messages])

  useEffect(() => {
    if (!currentConversationId) return
    if (currentConversationId === prevConversationIdRef.current) return

    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current)
      regenerateTimeoutRef.current = undefined
    }

    const conversation = conversations.find(
      (item: Conversation) => item.id === currentConversationId
    )
    if (!conversation) return

    setMessages(conversation.messages)
    setResponseDurations({})
    generatedFollowUpsRef.current = {}
    followUpErrorsRef.current = {}
    setGeneratedFollowUps({})
    setFollowUpErrors({})
    lastSavedMessagesRef.current = conversation.messages
    prevConversationIdRef.current = currentConversationId
  }, [currentConversationId, conversations, setMessages])

  useEffect(() => {
    if (!currentConversationId) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    if (messages === lastSavedMessagesRef.current) return

    saveTimeoutRef.current = setTimeout(
      () => {
        lastSavedMessagesRef.current = messages
        updateMessages(currentConversationId, messages)
      },
      status === 'streaming' ? 100 : 1000
    )

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [messages, currentConversationId, updateMessages, status])

  useEffect(() => {
    return () => {
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current)
      }
    }
  }, [])

  const submitPrompt = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      sendMessage({
        parts: [{ type: 'text', text: trimmed }],
      })
    },
    [isLoading, sendMessage]
  )

  const handleToolResult = useCallback(
    (toolCallId: string, result: string) => {
      addToolResult({ toolCallId, tool: 'ask_user', output: result })
    },
    [addToolResult]
  )

  const handleClear = useCallback(() => {
    stop()

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = undefined
    }
    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current)
      regenerateTimeoutRef.current = undefined
    }

    setMessages([])
    setResponseDurations({})
    setSessionId(crypto.randomUUID())

    if (currentConversationId) {
      updateMessages(currentConversationId, [])
      lastSavedMessagesRef.current = []
    }
    generatedFollowUpsRef.current = {}
    followUpErrorsRef.current = {}
    setGeneratedFollowUps({})
    setFollowUpErrors({})
  }, [stop, setMessages, currentConversationId, updateMessages])

  useImperativeHandle(ref, () => ({ handleClear, submitPrompt }), [
    handleClear,
    submitPrompt,
  ])

  const handleRegenerate = useCallback(() => {
    stop()

    const lastUserMessage = findLastUserMessage(messages)
    if (!lastUserMessage) return

    const textPart = getTextPart(lastUserMessage)
    if (!textPart) return

    const messagesWithoutLastExchange = messages.slice(
      0,
      messages.lastIndexOf(lastUserMessage)
    )
    setMessages(messagesWithoutLastExchange)

    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current)
    }

    regenerateTimeoutRef.current = setTimeout(() => {
      sendMessage({
        parts: [{ type: 'text', text: textPart.text }],
      })
      regenerateTimeoutRef.current = undefined
    }, 100)
  }, [messages, stop, sendMessage, setMessages])

  const lastUserMessageIndex = useMemo(
    () => messages.findLastIndex((message) => message.role === 'user'),
    [messages]
  )

  useEffect(() => {
    if (status !== 'ready' || isLoading || error || !lastAssistantMessageId) {
      return
    }

    const messageId = lastAssistantMessageId
    if (
      followUpRequestRef.current === messageId ||
      generatedFollowUpsRef.current[messageId] ||
      followUpErrorsRef.current[messageId]
    ) {
      return
    }

    followUpRequestRef.current = messageId
    const controller = new AbortController()

    async function generateFollowUps(signal: AbortSignal) {
      try {
        const response = await apiFetch('/api/v1/agent/followups', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: latestMessagesRef.current, model }),
          signal,
        })
        const payload = (await response.json().catch(() => ({}))) as {
          readonly error?: unknown
          readonly suggestions?: unknown
        }

        if (signal.aborted) return

        if (!response.ok) {
          const nextError = isAgentError(payload?.error)
            ? payload.error
            : ({
                type: 'unknown',
                message: 'Follow-up generation failed.',
                suggestion: 'The main answer is still available.',
                timestamp: Date.now(),
                model,
              } satisfies AgentError)

          setFollowUpErrors((previous) => {
            const next = {
              ...previous,
              [messageId]: nextError,
            }
            followUpErrorsRef.current = next
            return next
          })
          return
        }

        const suggestions = Array.isArray(payload?.suggestions)
          ? payload.suggestions.filter(
              (item: unknown): item is string =>
                typeof item === 'string' && item.trim().length > 0
            )
          : []

        if (suggestions.length > 0) {
          if (signal.aborted) return
          setGeneratedFollowUps((previous) => {
            const next = {
              ...previous,
              [messageId]: suggestions.slice(0, 3),
            }
            generatedFollowUpsRef.current = next
            return next
          })
        }
      } catch (generationError) {
        if (
          signal.aborted ||
          (generationError instanceof Error &&
            generationError.name === 'AbortError')
        ) {
          return
        }

        const nextError: AgentError = {
          type: 'unknown',
          message:
            generationError instanceof Error
              ? generationError.message
              : 'Follow-up generation failed.',
          suggestion: 'The main answer is still available.',
          timestamp: Date.now(),
          model,
        }

        setFollowUpErrors((previous) => {
          const next = {
            ...previous,
            [messageId]: nextError,
          }
          followUpErrorsRef.current = next
          return next
        })
      } finally {
        if (!signal.aborted && followUpRequestRef.current === messageId) {
          followUpRequestRef.current = undefined
        }
      }
    }

    void generateFollowUps(controller.signal)

    return () => {
      controller.abort()
      if (followUpRequestRef.current === messageId) {
        followUpRequestRef.current = undefined
      }
    }
  }, [status, isLoading, error, lastAssistantMessageId, model])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!hideHeader && (
        <AgentChatHeader
          isSidebarOpen={isSidebarOpen}
          isLoading={isLoading}
          onClear={handleClear}
          onMenuClick={onMenuClick}
          onStop={stop}
        />
      )}

      {hideHeader &&
        !hideCompactControls &&
        (isLoading || messages.length > 0) && (
          <AgentChatCompactControls
            isLoading={isLoading}
            onClear={handleClear}
            onStop={stop}
          />
        )}

      <ConversationUI>
        <ConversationContent className="gap-4">
          {isEmpty ? (
            <ConversationEmptyState className="justify-start px-0 py-6 text-left sm:py-8">
              <AgentChatEmptyState onSubmitPrompt={submitPrompt} />
            </ConversationEmptyState>
          ) : (
            <>
              {messages.map((message, index) => {
                const isMessageStreaming =
                  isLoading &&
                  message.role === 'assistant' &&
                  index === messages.length - 1

                const isLatestAssistant =
                  message.role === 'assistant' &&
                  lastAssistantMessage?.id === message.id

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLastUserMessage={index === lastUserMessageIndex}
                    isStreaming={isMessageStreaming}
                    responseDurationMs={responseDurations[message.id]}
                    error={isLatestAssistant && !isLoading ? error : null}
                    followUpError={followUpErrors[message.id] ?? null}
                    onRegenerate={
                      index === lastUserMessageIndex
                        ? handleRegenerate
                        : undefined
                    }
                    onErrorDismiss={handleClear}
                    onToolResult={handleToolResult}
                  />
                )
              })}
              {isLoading && <StreamingTypingIndicator messages={messages} />}
            </>
          )}
        </ConversationContent>
      </ConversationUI>

      {error && !lastAssistantMessage && (
        <AgentErrorDisplay
          error={error}
          onRetry={handleRegenerate}
          onDismiss={handleClear}
        />
      )}

      <div className="shrink-0 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
        {!isLoading && followUpSuggestions.length > 0 && (
          <div className="mb-2">
            <Suggestions>
              {followUpSuggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={submitPrompt}
                />
              ))}
            </Suggestions>
          </div>
        )}
        <PromptInputTextareaWithMentions
          disabled={isLoading}
          onResolvedSubmit={submitPrompt}
        />
        <p className="mt-2 px-1 text-[11px] leading-4 text-muted-foreground">
          Messages are stored in this browser&apos;s localStorage.
        </p>
        {isLoading && messages.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-7 text-xs transition-[transform,background-color] active:scale-[0.96]"
            >
              <RefreshCwIcon className="mr-1 h-3 w-3" />
              Regenerate
            </Button>
            <span className="text-xs text-muted-foreground">or</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="h-7 text-xs transition-[transform,background-color] active:scale-[0.96]"
            >
              <SquareIcon className="mr-1 h-3 w-3" />
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})
