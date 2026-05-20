'use client'

'use no memo'

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
import useSWRMutation from 'swr/mutation'
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
import { useConversationContext } from '@/lib/ai/agent/conversation-context'
import { isAgentError } from '@/lib/ai/agent/errors'
import { extractMessageError } from '@/lib/ai/agent/message-metadata'
import { getSavedModel } from '@/lib/hooks/use-agent-model'
import { useToolConfig } from '@/lib/hooks/use-tool-config'
import { useHostId } from '@/lib/swr'
import { apiFetch } from '@/lib/swr/api-fetch'

const FOLLOW_UP_RETRY_DELAY_MS = 10_000
const MAX_FOLLOW_UP_RETRY_ATTEMPTS = 3

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

interface FollowUpRetryRequest {
  readonly cacheKey: string
  readonly attempt: number
}

interface FollowUpMutationArg {
  readonly cacheKey: string
  readonly messages: ReturnType<typeof buildCompactFollowUpMessages>
  readonly model: string
}

interface FollowUpMutationResult {
  readonly cacheKey: string
  readonly suggestions: string[]
}

class FollowUpGenerationError extends Error {
  readonly cacheKey: string
  readonly agentError: AgentError

  constructor(cacheKey: string, agentError: AgentError) {
    super(agentError.message)
    this.name = 'FollowUpGenerationError'
    this.cacheKey = cacheKey
    this.agentError = agentError
  }
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

function findPrecedingUserMessageId(
  messages: readonly UIMessage[],
  messageIndex: number
) {
  for (let index = messageIndex - 1; index >= 0; index--) {
    if (messages[index].role === 'user') return messages[index].id
  }
  return undefined
}

function findAssistantIndexAfterUser(
  messages: readonly UIMessage[],
  userMessageId: string
) {
  const userIndex = messages.findIndex(
    (message) => message.id === userMessageId
  )
  if (userIndex < 0) return -1

  for (let index = userIndex + 1; index < messages.length; index++) {
    if (messages[index].role === 'user') return -1
    if (messages[index].role === 'assistant') return index
  }

  return -1
}

function replaceAssistantBranch({
  messages,
  userMessageId,
  assistant,
}: {
  readonly messages: readonly UIMessage[]
  readonly userMessageId: string
  readonly assistant: UIMessage
}) {
  const userIndex = messages.findIndex(
    (message) => message.id === userMessageId
  )
  if (userIndex < 0) return [...messages]

  const assistantIndex = findAssistantIndexAfterUser(messages, userMessageId)
  if (assistantIndex < 0) {
    return [...messages.slice(0, userIndex + 1), assistant]
  }

  return [...messages.slice(0, assistantIndex), assistant]
}

function getBranchSignature(message: UIMessage): string {
  try {
    return JSON.stringify(message.parts)
  } catch (_error) {
    return String(message.parts.length)
  }
}

function hashString(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

function getBranchCacheKey(message: UIMessage): string {
  return `${message.id}:${hashString(getBranchSignature(message))}`
}

function clampFollowUpText(value: string): string {
  const maxChars = 1_200
  if (value.length <= maxChars) return value
  return `${value.slice(0, maxChars - 3)}...`
}

function getCompactFollowUpText(part: unknown): string | null {
  if (typeof part !== 'object' || part === null || !('type' in part)) {
    return null
  }

  const typedPart = part as {
    type?: unknown
    text?: unknown
    toolName?: unknown
  }
  if (typedPart.type === 'text' && typeof typedPart.text === 'string') {
    return typedPart.text
  }
  if (typedPart.type === 'reasoning' && typeof typedPart.text === 'string') {
    return `Reasoning: ${typedPart.text}`
  }
  if (typedPart.type === 'dynamic-tool') {
    const toolName =
      typeof typedPart.toolName === 'string' ? typedPart.toolName : 'tool'
    return `Tool call: ${toolName}`
  }
  if (
    typeof typedPart.type === 'string' &&
    typedPart.type.startsWith('tool-')
  ) {
    return `Tool call: ${typedPart.type.replace(/^tool-/, '')}`
  }

  return null
}

function buildCompactFollowUpMessages(messages: readonly UIMessage[]) {
  return messages
    .slice(-12)
    .map((message) => {
      const parts = message.parts
        .map(getCompactFollowUpText)
        .filter((text): text is string => Boolean(text?.trim()))
        .map((text) => ({
          type: 'text' as const,
          text: clampFollowUpText(text.trim()),
        }))

      if (parts.length === 0) return null
      return {
        role: message.role,
        parts,
      }
    })
    .filter(
      (
        message
      ): message is {
        role: UIMessage['role']
        parts: Array<{ type: 'text'; text: string }>
      } => message !== null
    )
}

function getUserRetryText(message: UIMessage): string {
  return message.parts
    .map((part) =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      part.type === 'text' &&
      'text' in part &&
      typeof part.text === 'string'
        ? part.text
        : ''
    )
    .filter((text) => text.trim().length > 0)
    .join('\n')
    .trim()
}

async function postFollowUps(
  _key: readonly [string, string],
  { arg }: { arg: FollowUpMutationArg }
): Promise<FollowUpMutationResult> {
  const response = await apiFetch('/api/v1/agent/followups', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: arg.messages,
      model: arg.model,
    }),
  })
  const payload = (await response.json().catch(() => ({}))) as {
    readonly error?: unknown
    readonly suggestions?: unknown
  }

  if (!response.ok) {
    const agentError = isAgentError(payload?.error)
      ? payload.error
      : ({
          type: 'unknown',
          message: 'Follow-up generation failed.',
          suggestion: 'The main answer is still available.',
          timestamp: Date.now(),
          model: arg.model,
        } satisfies AgentError)

    throw new FollowUpGenerationError(arg.cacheKey, agentError)
  }

  const suggestions = Array.isArray(payload?.suggestions)
    ? payload.suggestions.filter(
        (item: unknown): item is string =>
          typeof item === 'string' && item.trim().length > 0
      )
    : []

  return {
    cacheKey: arg.cacheKey,
    suggestions: suggestions.slice(0, 3),
  }
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
    regenerate,
    addToolResult,
  } = useChat({ transport })

  const sendTimestampRef = useRef<number>(0)
  const prevStatusRef = useRef<string>(status)
  const lastSavedMessagesRef = useRef<UIMessage[]>([])
  const latestMessagesRef = useRef<readonly UIMessage[]>([])
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pendingBranchUserIdRef = useRef<string | undefined>(undefined)
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
  const [followUpRetryRequest, setFollowUpRetryRequest] =
    useState<FollowUpRetryRequest | null>(null)
  const generatedFollowUpsRef = useRef<Record<string, string[]>>({})
  const followUpErrorsRef = useRef<Record<string, AgentError>>({})
  const followUpRetryAttemptsRef = useRef<Record<string, number>>({})
  const followUpRetryConsumedRef = useRef<Record<string, number>>({})
  const followUpRetryTimersRef = useRef<Record<string, NodeJS.Timeout>>({})
  const responseBranchesRef = useRef<Record<string, UIMessage[]>>({})
  const activeBranchIndexesRef = useRef<Record<string, number>>({})
  const [responseBranches, setResponseBranches] = useState<
    Record<string, UIMessage[]>
  >({})
  const [activeBranchIndexes, setActiveBranchIndexes] = useState<
    Record<string, number>
  >({})

  const isLoading = status === 'streaming' || status === 'submitted'
  const isEmpty = messages.length === 0
  const lastAssistantMessage = useMemo(
    () => findLastAssistantMessage(messages),
    [messages]
  )
  const lastAssistantHasError = lastAssistantMessage
    ? extractMessageError(lastAssistantMessage) !== null
    : false
  const lastAssistantFollowUpKey =
    lastAssistantMessage && !lastAssistantHasError
      ? getBranchCacheKey(lastAssistantMessage)
      : undefined
  const followUpSuggestions =
    lastAssistantFollowUpKey != null
      ? (generatedFollowUps[lastAssistantFollowUpKey] ?? [])
      : []

  const clearFollowUpRetryState = useCallback((cacheKey: string) => {
    const timer = followUpRetryTimersRef.current[cacheKey]
    if (timer) clearTimeout(timer)
    delete followUpRetryTimersRef.current[cacheKey]
    delete followUpRetryAttemptsRef.current[cacheKey]
  }, [])

  const clearAllFollowUpRetryState = useCallback(() => {
    for (const timer of Object.values(followUpRetryTimersRef.current)) {
      clearTimeout(timer)
    }
    followUpRetryTimersRef.current = {}
    followUpRetryAttemptsRef.current = {}
    followUpRetryConsumedRef.current = {}
    setFollowUpRetryRequest(null)
  }, [])

  const clearFollowUpError = useCallback((cacheKey: string) => {
    if (!followUpErrorsRef.current[cacheKey]) return

    setFollowUpErrors((previous) => {
      const next = { ...previous }
      delete next[cacheKey]
      followUpErrorsRef.current = next
      return next
    })
  }, [])

  const scheduleFollowUpRetry = useCallback((cacheKey: string) => {
    if (followUpRetryTimersRef.current[cacheKey]) return

    const nextAttempt = (followUpRetryAttemptsRef.current[cacheKey] ?? 0) + 1
    if (nextAttempt > MAX_FOLLOW_UP_RETRY_ATTEMPTS) return

    followUpRetryAttemptsRef.current[cacheKey] = nextAttempt
    followUpRetryTimersRef.current[cacheKey] = setTimeout(() => {
      delete followUpRetryTimersRef.current[cacheKey]
      setFollowUpRetryRequest({ cacheKey, attempt: nextAttempt })
    }, FOLLOW_UP_RETRY_DELAY_MS)
  }, [])

  const { trigger: triggerFollowUps, isMutating: isGeneratingFollowUps } =
    useSWRMutation(
      lastAssistantFollowUpKey
        ? (['/api/v1/agent/followups', lastAssistantFollowUpKey] as const)
        : null,
      postFollowUps,
      {
        populateCache: false,
        revalidate: false,
        throwOnError: false,
        onSuccess: (result) => {
          clearFollowUpRetryState(result.cacheKey)
          clearFollowUpError(result.cacheKey)

          if (result.suggestions.length === 0) return

          setGeneratedFollowUps((previous) => {
            const next = {
              ...previous,
              [result.cacheKey]: result.suggestions,
            }
            generatedFollowUpsRef.current = next
            return next
          })
        },
        onError: (mutationError) => {
          const cacheKey =
            mutationError instanceof FollowUpGenerationError
              ? mutationError.cacheKey
              : lastAssistantFollowUpKey
          if (!cacheKey) return

          const nextError: AgentError =
            mutationError instanceof FollowUpGenerationError
              ? mutationError.agentError
              : {
                  type: 'unknown',
                  message:
                    mutationError instanceof Error
                      ? mutationError.message
                      : 'Follow-up generation failed.',
                  suggestion: 'The main answer is still available.',
                  timestamp: Date.now(),
                  model,
                }

          setFollowUpErrors((previous) => {
            const next = {
              ...previous,
              [cacheKey]: nextError,
            }
            followUpErrorsRef.current = next
            return next
          })
          scheduleFollowUpRetry(cacheKey)
        },
      }
    )

  useEffect(() => {
    latestMessagesRef.current = messages
    onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  useEffect(() => {
    return () => {
      clearAllFollowUpRetryState()
    }
  }, [clearAllFollowUpRetryState])

  useEffect(() => {
    const previousStatus = prevStatusRef.current
    prevStatusRef.current = status

    if (
      previousStatus !== 'submitted' &&
      previousStatus !== 'streaming' &&
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
        [getBranchCacheKey(lastAssistantMessage)]: duration,
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
    generatedFollowUpsRef.current = {}
    followUpErrorsRef.current = {}
    clearAllFollowUpRetryState()
    responseBranchesRef.current = {}
    activeBranchIndexesRef.current = {}
    setGeneratedFollowUps({})
    setFollowUpErrors({})
    setResponseBranches({})
    setActiveBranchIndexes({})
    pendingBranchUserIdRef.current = undefined
    lastSavedMessagesRef.current = conversation.messages
    prevConversationIdRef.current = currentConversationId
  }, [
    currentConversationId,
    conversations,
    setMessages,
    clearAllFollowUpRetryState,
  ])

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

      pendingBranchUserIdRef.current = undefined
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
    setSessionId(crypto.randomUUID())

    if (currentConversationId) {
      updateMessages(currentConversationId, [])
      lastSavedMessagesRef.current = []
    }
    generatedFollowUpsRef.current = {}
    followUpErrorsRef.current = {}
    clearAllFollowUpRetryState()
    responseBranchesRef.current = {}
    activeBranchIndexesRef.current = {}
    pendingBranchUserIdRef.current = undefined
    setGeneratedFollowUps({})
    setFollowUpErrors({})
    setResponseBranches({})
    setActiveBranchIndexes({})
  }, [
    stop,
    setMessages,
    currentConversationId,
    updateMessages,
    clearAllFollowUpRetryState,
  ])

  useImperativeHandle(ref, () => ({ handleClear, submitPrompt }), [
    handleClear,
    submitPrompt,
  ])

  const saveAssistantBranch = useCallback(
    (userMessageId: string, assistant: UIMessage) => {
      const existing = responseBranchesRef.current[userMessageId] ?? []
      const assistantSignature = getBranchSignature(assistant)
      const existingIndex = existing.findIndex(
        (branch) =>
          branch.id === assistant.id &&
          getBranchSignature(branch) === assistantSignature
      )
      const nextBranches =
        existingIndex >= 0 ? existing : [...existing, assistant]
      const nextIndex =
        existingIndex >= 0 ? existingIndex : nextBranches.length - 1

      responseBranchesRef.current = {
        ...responseBranchesRef.current,
        [userMessageId]: nextBranches,
      }
      activeBranchIndexesRef.current = {
        ...activeBranchIndexesRef.current,
        [userMessageId]: nextIndex,
      }
      setResponseBranches(responseBranchesRef.current)
      setActiveBranchIndexes(activeBranchIndexesRef.current)

      return nextIndex
    },
    []
  )

  const handleRegenerate = useCallback(
    (assistantMessageId?: string) => {
      if (isLoading) return

      const assistantIndex =
        assistantMessageId != null
          ? messages.findIndex((message) => message.id === assistantMessageId)
          : messages.findLastIndex((message) => message.role === 'assistant')
      const assistantMessage =
        assistantIndex >= 0 ? messages[assistantIndex] : undefined
      const userMessageId =
        assistantIndex >= 0
          ? findPrecedingUserMessageId(messages, assistantIndex)
          : findLastUserMessage(messages)?.id

      if (!userMessageId) return

      if (assistantMessage?.role === 'assistant') {
        saveAssistantBranch(userMessageId, assistantMessage)
      }

      pendingBranchUserIdRef.current = userMessageId
      void regenerate(
        assistantMessage?.role === 'assistant'
          ? { messageId: assistantMessage.id }
          : undefined
      )
    },
    [isLoading, messages, regenerate, saveAssistantBranch]
  )

  const handleBranchChange = useCallback(
    (userMessageId: string, branchIndex: number) => {
      if (isLoading) return

      const assistant =
        responseBranchesRef.current[userMessageId]?.[branchIndex]
      if (!assistant) return

      activeBranchIndexesRef.current = {
        ...activeBranchIndexesRef.current,
        [userMessageId]: branchIndex,
      }
      setActiveBranchIndexes(activeBranchIndexesRef.current)
      setMessages((currentMessages) =>
        replaceAssistantBranch({
          messages: currentMessages,
          userMessageId,
          assistant,
        })
      )
    },
    [isLoading, setMessages]
  )

  useEffect(() => {
    if (status !== 'ready') return

    const userMessageId = pendingBranchUserIdRef.current
    if (!userMessageId || !lastAssistantMessage) return

    saveAssistantBranch(userMessageId, lastAssistantMessage)
    pendingBranchUserIdRef.current = undefined
  }, [lastAssistantMessage, saveAssistantBranch, status])

  useEffect(() => {
    if (status === 'error') {
      pendingBranchUserIdRef.current = undefined
      sendTimestampRef.current = 0
    }
  }, [status])

  const handleRootErrorRetry = useCallback(() => {
    if (isLoading) return

    const userMessage = findLastUserMessage(messages)
    if (!userMessage) return
    const retryText = getUserRetryText(userMessage)
    if (!retryText) return

    pendingBranchUserIdRef.current = undefined
    sendMessage({
      parts: [{ type: 'text', text: retryText }],
    })
  }, [isLoading, messages, sendMessage])

  useEffect(() => {
    if (status !== 'ready' || isLoading || error || !lastAssistantFollowUpKey) {
      return
    }

    const cacheKey = lastAssistantFollowUpKey
    const retryAttempt =
      followUpRetryRequest?.cacheKey === cacheKey
        ? followUpRetryRequest.attempt
        : 0
    const isScheduledRetry =
      retryAttempt > 0 &&
      followUpRetryConsumedRef.current[cacheKey] !== retryAttempt

    if (
      isGeneratingFollowUps ||
      generatedFollowUpsRef.current[cacheKey] ||
      (followUpErrorsRef.current[cacheKey] && !isScheduledRetry)
    ) {
      return
    }

    if (isScheduledRetry) {
      followUpRetryConsumedRef.current[cacheKey] = retryAttempt
    }

    void triggerFollowUps({
      cacheKey,
      messages: buildCompactFollowUpMessages(latestMessagesRef.current),
      model,
    })
  }, [
    status,
    isLoading,
    error,
    lastAssistantFollowUpKey,
    model,
    followUpRetryRequest,
    isGeneratingFollowUps,
    triggerFollowUps,
  ])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!hideHeader && (
        <AgentChatHeader
          isSidebarOpen={isSidebarOpen}
          onClear={handleClear}
          onMenuClick={onMenuClick}
        />
      )}

      {hideHeader &&
        !hideCompactControls &&
        (isLoading || messages.length > 0) && (
          <AgentChatCompactControls onClear={handleClear} />
        )}

      <ConversationUI>
        <ConversationContent className="gap-3">
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
                const userMessageId =
                  message.role === 'assistant'
                    ? findPrecedingUserMessageId(messages, index)
                    : undefined
                const branchCount = userMessageId
                  ? (responseBranches[userMessageId]?.length ?? 1)
                  : 1
                const branchIndex = userMessageId
                  ? (activeBranchIndexes[userMessageId] ?? branchCount - 1)
                  : 0
                const followUpKey =
                  message.role === 'assistant'
                    ? getBranchCacheKey(message)
                    : undefined
                const responseDurationKey =
                  message.role === 'assistant'
                    ? getBranchCacheKey(message)
                    : undefined

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isMessageStreaming}
                    responseDurationMs={
                      responseDurationKey
                        ? responseDurations[responseDurationKey]
                        : undefined
                    }
                    error={isLatestAssistant && !isLoading ? error : null}
                    followUpError={
                      followUpKey ? (followUpErrors[followUpKey] ?? null) : null
                    }
                    onRegenerate={
                      isLatestAssistant && !isLoading
                        ? () => handleRegenerate(message.id)
                        : undefined
                    }
                    branchIndex={branchIndex}
                    branchCount={branchCount}
                    onBranchChange={
                      isLatestAssistant &&
                      userMessageId &&
                      branchCount > 1 &&
                      !isLoading
                        ? (nextIndex) =>
                            handleBranchChange(userMessageId, nextIndex)
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
          onRetry={handleRootErrorRetry}
          onDismiss={handleClear}
        />
      )}

      <div className="shrink-0 px-3 pb-2 pt-2 sm:px-4 sm:pb-3">
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
          isLoading={isLoading}
          onStop={stop}
          onResolvedSubmit={submitPrompt}
        />
        <p className="mt-1.5 px-1 text-[11px] leading-4 text-muted-foreground">
          Messages are stored in this browser&apos;s localStorage.
        </p>
      </div>
    </div>
  )
})
