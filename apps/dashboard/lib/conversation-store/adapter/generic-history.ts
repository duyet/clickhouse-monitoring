/**
 * Shared helpers for the assistant-ui generic thread-history adapters
 * (localStorage + D1). Both backends store a `MessageFormatRepository` blob and
 * mutate it with the same insert / replace semantics.
 */

import type {
  MessageFormatItem,
  MessageFormatRepository,
} from '@assistant-ui/react'

/**
 * Insert `item`, or replace an existing entry with the same message id, then
 * point `headId` at it.
 */
export function upsertHistoryItem<TMessage>(
  repo: MessageFormatRepository<TMessage>,
  item: MessageFormatItem<TMessage>,
  getId: (message: TMessage) => string
): void {
  const id = getId(item.message)
  const index = repo.messages.findIndex((entry) => getId(entry.message) === id)
  if (index >= 0) {
    repo.messages[index] = item
  } else {
    repo.messages.push(item)
  }
  repo.headId = id
}

/**
 * Replace the entry previously stored under `previousId` — used when a local
 * (optimistic) message id is reconciled to its persisted id.
 */
export function replaceHistoryItem<TMessage>(
  repo: MessageFormatRepository<TMessage>,
  item: MessageFormatItem<TMessage>,
  previousId: string,
  getId: (message: TMessage) => string
): void {
  const index = repo.messages.findIndex(
    (entry) => getId(entry.message) === previousId
  )
  if (index >= 0) {
    repo.messages[index] = item
  } else {
    repo.messages.push(item)
  }
  repo.headId = getId(item.message)
}
