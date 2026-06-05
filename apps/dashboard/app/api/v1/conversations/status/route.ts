import { resolveUserId } from '@/lib/conversation-store/auth'
import { getConversationStoreConfig } from '@/lib/conversation-store/config'
import {
  resolveConversationStoreStatus,
  resolveStore,
} from '@/lib/conversation-store/resolve-store'
import { ConversationStoreError } from '@/lib/conversation-store/types'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  try {
    const config = getConversationStoreConfig()
    const status = resolveConversationStoreStatus(config)

    if (!status.enabled || !status.persistent) {
      return Response.json({
        enabled: false,
        store: 'local',
        requestedStore: status.requestedStore,
        persistent: false,
        reason: status.reason,
      })
    }

    try {
      await resolveUserId()
    } catch (error) {
      if (error instanceof ConversationStoreError) {
        return Response.json({
          enabled: false,
          store: 'local',
          requestedStore: status.requestedStore,
          persistent: false,
          reason: 'Authentication is required for server conversation storage.',
        })
      }
      throw error
    }

    try {
      await resolveStore()
    } catch (error) {
      if (error instanceof ConversationStoreError) {
        return Response.json({
          enabled: false,
          store: 'local',
          requestedStore: status.requestedStore,
          persistent: false,
          reason: error.message,
        })
      }
      throw error
    }

    return Response.json({
      enabled: true,
      store: status.store,
      requestedStore: status.requestedStore,
      persistent: status.persistent,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Conversation storage status unavailable.'

    return Response.json(
      {
        enabled: false,
        store: 'local',
        persistent: false,
        reason: message,
      },
      { status: 500 }
    )
  }
}
