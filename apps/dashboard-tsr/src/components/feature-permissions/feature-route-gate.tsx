import { menuItemsConfig } from '@/menu'

import type { ReactNode } from 'react'

import { FeatureUnavailable } from './feature-unavailable'
import { usePathname } from '@/lib/next-compat'
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
    // Interaction-gated features (e.g. the agent) render their UI for everyone
    // and prompt for sign-in only when an auth-requiring action is attempted.
    if (permission.interactionGated) return children
    return <FeatureUnavailable feature={permission.feature} reason="auth" />
  }

  return children
}
