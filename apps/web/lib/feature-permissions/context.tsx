'use client'

import type { FeaturePermission, PublicFeaturePermissionConfig } from './types'

import { isFeatureAllowed, resolveFeatureState } from './shared'
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react'

const DEFAULT_PUBLIC_CONFIG: PublicFeaturePermissionConfig = {
  authProvider: 'none',
  principal: 'anonymous',
  features: {},
}

interface FeaturePermissionsContextValue {
  config: PublicFeaturePermissionConfig
  isLoading: boolean
  isAllowed: (permission?: FeaturePermission) => boolean
  isEnabled: (permission?: FeaturePermission) => boolean
}

const FeaturePermissionsContext =
  createContext<FeaturePermissionsContextValue | null>(null)

export function FeaturePermissionsProvider({
  children,
}: {
  children: ReactNode
}) {
  const [config, setConfig] = useState<PublicFeaturePermissionConfig>(
    DEFAULT_PUBLIC_CONFIG
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      try {
        const response = await fetch('/api/v1/config', {
          cache: 'no-store',
          credentials: 'same-origin',
        })
        if (!response.ok) return

        const nextConfig =
          (await response.json()) as PublicFeaturePermissionConfig
        if (!cancelled) setConfig(nextConfig)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<FeaturePermissionsContextValue>(
    () => ({
      config,
      isLoading,
      isAllowed: (permission) => isFeatureAllowed(permission, config),
      isEnabled: (permission) =>
        resolveFeatureState(permission, config).enabled,
    }),
    [config, isLoading]
  )

  return (
    <FeaturePermissionsContext.Provider value={value}>
      {children}
    </FeaturePermissionsContext.Provider>
  )
}

export function useFeaturePermissions() {
  return (
    use(FeaturePermissionsContext) ?? {
      config: DEFAULT_PUBLIC_CONFIG,
      isLoading: true,
      isAllowed: (permission?: FeaturePermission) =>
        isFeatureAllowed(permission, DEFAULT_PUBLIC_CONFIG),
      isEnabled: (permission?: FeaturePermission) =>
        resolveFeatureState(permission, DEFAULT_PUBLIC_CONFIG).enabled,
    }
  )
}
