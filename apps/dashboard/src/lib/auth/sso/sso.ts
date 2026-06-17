// Enterprise-gated SSO scaffold.
//
// Community edition is completely unaffected — this module is standalone and
// never changes the none/clerk/proxy auth path. isSsoEnabled() returns false
// in community, so getSsoProviders() always returns [] for community builds.
// No UI surfaces, no API routes, no login-flow code here yet — this is a typed
// foundation for future enterprise SSO (SAML/OIDC) support.

import { isEnabled } from '@/lib/edition'

export type SsoProtocol = 'saml' | 'oidc'

export interface SsoProvider {
  protocol: SsoProtocol
  id: string
  displayName: string
  // Future: initiate(request: Request): Promise<Response>
  // Future: callback(request: Request): Promise<Response>
}

/**
 * Empty registry — no SSO providers in community edition.
 * Enterprise builds will populate this with configured SAML/OIDC providers.
 */
export const SSO_STUB_PROVIDERS: readonly SsoProvider[] = []

/**
 * Returns true only when the SSO enterprise feature is enabled.
 *
 * In community (default), this always returns false. SSO is an enterprise-only
 * feature that does not degrade free functionality — it simply does not exist
 * in the community build.
 */
export function isSsoEnabled(
  runtimeEnv?: Record<string, string | undefined>
): boolean {
  return isEnabled('sso', runtimeEnv)
}

/**
 * Returns the list of configured SSO providers.
 *
 * Always returns [] in community edition (isSsoEnabled() is false), keeping
 * the app inert with respect to SSO. Enterprise builds will return populated
 * provider configs when SSO is enabled and providers are configured.
 */
export function getSsoProviders(
  runtimeEnv?: Record<string, string | undefined>
): readonly SsoProvider[] {
  if (!isSsoEnabled(runtimeEnv)) {
    return []
  }
  return SSO_STUB_PROVIDERS
}
