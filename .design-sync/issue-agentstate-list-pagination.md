## Context

PR #1731 (merged `cf15bbb`) routed **production** conversations to the AgentState backend via key-presence selection. That activation surfaces a pre-existing scalability limitation in the store's per-user listing.

## Problem

`AgentStateStore.list()` (`apps/dashboard/src/lib/conversation-store/agentstate-store.ts:381`) has **no server-side user filter**. It pages newest-first through the *whole* AgentState project and filters client-side by `metadata.userId`, bounded by `MAX_LIST_PAGES = 5` × `LIST_PAGE_SIZE = 100` = **500 conversations scanned max** (see lines 60-63, 387-400; behavior is documented in the doc-comment at 371-377).

Consequence: once the shared project accumulates **>500 newer conversations from other users**, an inactive user's own older conversations fall outside the scan window and **disappear from `/api/v1/conversations`** even though they still exist in AgentState. This was benign while AgentState was off in prod; it is now live.

Originally raised as a Codex P2 on PR #1731 (finding "E"). Not fixed in that PR because `agentstate-store.ts` was outside its diff and the bound is a deliberate, documented trade-off — tracking here instead.

## Proposed fix (verify against `@agentstate/sdk` capabilities first)

The store already tags each conversation `user:${userId}` on save (`agentstate-store.ts:248`) and uses a per-user `external_id` of `${userId}:${conversationId}` (line 145). The proper fix is to **filter server-side** instead of scan-then-filter:

1. **Preferred** — if `@agentstate/sdk` `listConversations()` supports a `tags` / `external_id`-prefix filter, pass `user:${userId}` (or the `${userId}:` prefix) so pagination is already user-scoped. Then `MAX_LIST_PAGES` bounds *that user's* history, not the global firehose, and the drop-older bug is gone.
2. **Fallback** — if the SDK has no server-side filter, raise/remove `MAX_LIST_PAGES` for the user-scoped path with proper cursor pagination, or maintain a per-user index. Document the chosen trade-off.

## Acceptance

- A user with conversations older than 500 newer global conversations still sees their full history (up to `limit`) from `/api/v1/conversations`.
- Add a regression test in `apps/dashboard/src/lib/conversation-store/` simulating >500 interleaved multi-user conversations.

## Refs
- `apps/dashboard/src/lib/conversation-store/agentstate-store.ts:368-410` (`list()`), `:60-63` (bounds), `:144-145` (`external_id`), `:248` (`user:` tag)
- Spec: `docs/knowledge/agentstate-conversation-store.md`
