export const AUTH_PROVIDER_ENV_VARS = [
  'CHM_AUTH_PROVIDER',
  'NEXT_PUBLIC_AUTH_PROVIDER',
] as const

export const AUTH_PROVIDERS = ['none', 'clerk'] as const

export type AuthProvider = (typeof AUTH_PROVIDERS)[number]

export class AuthProviderConfigError extends Error {
  constructor(value: string) {
    super(
      `Invalid auth provider value "${value}" in ${AUTH_PROVIDER_ENV_VARS.join(
        ' or '
      )}. Expected one of: none, clerk.`
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

  throw new AuthProviderConfigError(value ?? '')
}

export function getAuthProvider(): AuthProvider {
  return parseAuthProvider(
    process.env.CHM_AUTH_PROVIDER ?? process.env.NEXT_PUBLIC_AUTH_PROVIDER
  )
}

export function isClerkAuthProvider(): boolean {
  return getAuthProvider() === 'clerk'
}

export function isAuthProviderConfigError(
  error: unknown
): error is AuthProviderConfigError {
  return error instanceof AuthProviderConfigError
}
