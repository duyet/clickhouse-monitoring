// Server reads the runtime worker var CHM_AUTH_PROVIDER first, then falls back
// to the build-time client constant VITE_AUTH_PROVIDER (import.meta.env). The
// legacy Next `NEXT_PUBLIC_AUTH_PROVIDER` prefix is gone in the Vite app.
export const AUTH_PROVIDER_ENV_VARS = [
  'CHM_AUTH_PROVIDER',
  'VITE_AUTH_PROVIDER',
] as const

export const AUTH_PROVIDERS = ['none', 'clerk', 'proxy', 'trusted'] as const

export type AuthProvider = (typeof AUTH_PROVIDERS)[number]

export class AuthProviderConfigError extends Error {
  constructor(value: string) {
    super(
      `Invalid auth provider value "${value}" in ${AUTH_PROVIDER_ENV_VARS.join(
        ' or '
      )}. Expected one of: none, clerk, proxy, trusted.`
    )
    this.name = 'AuthProviderConfigError'
  }
}

export function parseAuthProvider(
  value: string | null | undefined
): AuthProvider {
  const normalized = value?.trim().toLowerCase()

  if (!normalized || normalized === 'none') {
    return 'none'
  }

  if (normalized === 'clerk') {
    return 'clerk'
  }

  if (normalized === 'proxy') {
    return 'proxy'
  }

  if (normalized === 'trusted') {
    return 'trusted'
  }

  throw new AuthProviderConfigError(value ?? '')
}

export function getAuthProvider(): AuthProvider {
  // Precedence: runtime CHM_AUTH_PROVIDER → build-time VITE_AUTH_PROVIDER →
  // legacy NEXT_PUBLIC_AUTH_PROVIDER. When none is set, the default comes from
  // the deployment profile: `CHM_DEPLOYMENT_MODE=cloud` → clerk, otherwise none. (The
  // profile check is inlined here, not imported from lib/config/deployment-mode, to keep
  // this module import-cycle-free — profile.ts depends on parseAuthProvider.)
  const explicit =
    process.env.CHM_AUTH_PROVIDER ??
    import.meta.env.VITE_AUTH_PROVIDER ??
    process.env.NEXT_PUBLIC_AUTH_PROVIDER
  if (explicit) return parseAuthProvider(explicit)
  const profile = (
    process.env.CHM_DEPLOYMENT_MODE ??
    import.meta.env.VITE_DEPLOYMENT_MODE ??
    ''
  )
    .trim()
    .toLowerCase()
  return profile === 'cloud' || profile === 'saas' ? 'clerk' : 'none'
}

export function isClerkAuthProvider(): boolean {
  return getAuthProvider() === 'clerk'
}

export function isAuthProviderConfigError(
  error: unknown
): error is AuthProviderConfigError {
  return error instanceof AuthProviderConfigError
}
