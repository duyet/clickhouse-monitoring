import type { AuthResult, ServerAuthProvider } from './types'

/**
 * The `none` provider treats every caller as authenticated. The dashboard is
 * public; access control (if any) is left to always-on API-key auth and to
 * ClickHouse itself. This is the default when no auth provider is configured.
 */
export class NoneAuthProvider implements ServerAuthProvider {
  async authenticateRequest(_request: Request): Promise<AuthResult> {
    return { authenticated: true }
  }
}
