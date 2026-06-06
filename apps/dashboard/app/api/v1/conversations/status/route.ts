import { resolveUserId } from '@/lib/conversation-store/auth'
import { getConversationStoreConfig } from '@/lib/conversation-store/config'
import {
  resolveConversationStoreStatus,
  resolveStore,
} from '@/lib/conversation-store/resolve-store'

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
    } catch {
      return Response.json({
        enabled: false,
        store: 'local',
        requestedStore: status.requestedStore,
        persistent: false,
        reason: 'Authentication is required for server conversation storage.',
      })
    }

    try {
      await resolveStore()
    } catch (error) {
      return Response.json({
        enabled: false,
        store: 'local',
        requestedStore: status.requestedStore,
        persistent: false,
        reason:
          error instanceof Error
            ? error.message
            : 'Server conversation storage is unavailable.',
      })
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

    return Response.json({
      enabled: false,
      store: 'local',
      persistent: false,
      reason: message,
    })
  }
}
