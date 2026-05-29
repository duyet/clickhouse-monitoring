'use client'

import { menuItemsConfig } from '@/menu'

import type { ReactNode } from 'react'

import { FeatureUnavailable } from './feature-unavailable'
import { usePathname } from 'next/navigation'
import { useFeaturePermissions } from '@/lib/feature-permissions/context'
import { findMenuPermissionForPath } from '@/lib/feature-permissions/menu'
import { resolveFeatureState } from '@/lib/feature-permissions/shared'

export function FeatureRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { config, isLoading } = useFeaturePermissions()
  const permission = findMenuPermissionForPath(menuItemsConfig, pathname)

  if (!permission) return children

  const state = resolveFeatureState(permission, config)
  if (isLoading) {
    return children
  }

  if (!state.enabled) {
    return <FeatureUnavailable feature={permission.feature} reason="disabled" />
  }

  if (
    state.access === 'authenticated' &&
    config.principal !== 'authenticated'
  ) {
    return <FeatureUnavailable feature={permission.feature} reason="auth" />
  }

  return children
}
