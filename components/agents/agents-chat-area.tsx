'use client'

'use no memo'

import { RefreshCwIcon, SquareIcon } from 'lucide-react'

import type { UIMessage } from 'ai'
import type { Conversation } from '@/lib/ai/agent/conversation-utils'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRouter } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { useConversationContext } from '@/lib/ai/agent/conversation-context'
import { getSavedModel } from '@/lib/hooks/use-agent-model'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { useHostId } from '@/lib/swr'

export interface AgentsChatAreaRef {
  handleClear: () => void
}

interface AgentsChatAreaProps {
  readonly isSidebarOpen: boolean
  readonly onMenuClick: () => void
  readonly hideHeader?: boolean
  readonly hideCompactControls?: boolean
  readonly initialQuery?: string | null
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
    initialQuery,
  }: AgentsChatAreaProps,
  ref
) {
  const hostId = useHostId()
  const router = useRouter()
  const { conversations, currentConversationId, updateMessages } =
    useConversationContext()
  const model = useMemo(() => getSavedModel(), [])
  const { disabledTools } = useToolConfig()

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
    stop,
    addToolResult,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/v1/agent',
      body: { hostId, model, disabledTools },
    }),
  })

  const sendTimestampRef = useRef<number>(0)
  const prevStatusRef = useRef<string>(status)
  const lastSavedMessagesRef = useRef<UIMessage[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const prevConversationIdRef = useRef<string | undefined>(undefined)
  const initialQuerySentRef = useRef<string | null>(null)
  const [responseDurations, setResponseDurations] = useState<
    Record<string, number>
  >({})

  const isLoading = status === 'streaming' || status === 'submitted'
  const isEmpty = messages.length === 0

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

    const conversation = conversations.find(
      (item: Conversation) => item.id === currentConversationId
    )
    if (!conversation) return

    setMessages(conversation.messages)
    setResponseDurations({})
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

    setMessages([])
    setResponseDurations({})

    if (currentConversationId) {
      updateMessages(currentConversationId, [])
      lastSavedMessagesRef.current = []
    }
  }, [stop, setMessages, currentConversationId, updateMessages])

  useImperativeHandle(ref, () => ({ handleClear }), [handleClear])

  useEffect(() => {
    const cleaned = initialQuery?.trim()
    if (
      !cleaned ||
      cleaned === initialQuerySentRef.current ||
      status !== 'ready'
    ) {
      return
    }

    initialQuerySentRef.current = cleaned
    sendMessage({
      parts: [
        {
          type: 'text',
          text: `Analyze this ClickHouse query:\n\n\`\`\`sql\n${cleaned}\n\`\`\``,
        },
      ],
    })

    const url = new URL(window.location.href)
    url.searchParams.delete('query')
    router.replace(url.pathname + url.search, { scroll: false })
  }, [initialQuery, status, sendMessage, router])

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

    setTimeout(() => {
      sendMessage({
        parts: [{ type: 'text', text: textPart.text }],
      })
    }, 100)
  }, [messages, stop, sendMessage, setMessages])

  const lastUserMessageIndex = useMemo(
    () => messages.findLastIndex((message) => message.role === 'user'),
    [messages]
  )

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

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    allMessages={messages}
                    isLastUserMessage={index === lastUserMessageIndex}
                    isStreaming={isMessageStreaming}
                    responseDurationMs={responseDurations[message.id]}
                    onRegenerate={
                      index === lastUserMessageIndex
                        ? handleRegenerate
                        : undefined
                    }
                    onSuggestionClick={submitPrompt}
                    onToolResult={handleToolResult}
                  />
                )
              })}
              {isLoading && <StreamingTypingIndicator messages={messages} />}
            </>
          )}
        </ConversationContent>
      </ConversationUI>

      {error && (
        <AgentErrorDisplay
          error={error}
          onRetry={handleRegenerate}
          onDismiss={handleClear}
        />
      )}

      <div className="shrink-0 border-t p-3 sm:p-4">
        <PromptInputTextareaWithMentions
          disabled={isLoading}
          onResolvedSubmit={submitPrompt}
        />
        {isLoading && messages.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-7 text-xs"
            >
              <RefreshCwIcon className="mr-1 h-3 w-3" />
              Regenerate
            </Button>
            <span className="text-xs text-muted-foreground">or</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="h-7 text-xs"
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
