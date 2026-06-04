/**
 * Pluggable server-side auth provider contract.
 *
 * A `ServerAuthProvider` answers one question for an incoming `/api/v1`
 * request: is the caller an authenticated principal? Each configured auth
 * provider (`none` / `clerk` / `proxy`) supplies one implementation; the guard
 * in `api-guard.ts` resolves the active one via `resolveServerAuthProvider`.
 *
 * Every implementation MUST fail closed — any internal error or missing config
 * resolves to `{ authenticated: false }` rather than throwing, so a misconfig
 * never accidentally grants access.
 */
export interface AuthResult {
  authenticated: boolean
  /** Stable identifier for the principal (user id, email, …) when known. */
  subject?: string
}

export interface ServerAuthProvider {
  authenticateRequest(request: Request): Promise<AuthResult>
}
