import { mock } from 'bun:test'

/**
 * Shared Clerk auth mock for the agent API route tests.
 *
 * `mock.module()` registers a GLOBAL override, and in the aggregated
 * `bun test` run the LAST registration wins for the whole process. When each
 * route test mocked `@clerk/nextjs/server` over its own `mockClerkUserId`
 * closure, a "returns 401 when unauthenticated" assertion in one file would
 * read another file's authed user once the suites ran together (it passed in
 * isolation, failed in CI).
 *
 * Routing every agent route test through this single module — backed by one
 * shared, resettable `userId` — keeps the mock deterministic regardless of the
 * order Bun loads the files in.
 */
const state: { userId: string | null } = { userId: null }

/** Set the userId the mocked Clerk `auth()` resolves to (null = signed out). */
export function setMockClerkUserId(userId: string | null): void {
  state.userId = userId
}

mock.module('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: state.userId }),
}))
