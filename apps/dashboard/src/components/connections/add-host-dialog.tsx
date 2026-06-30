import type { HostStorageMode } from '@/lib/types/host-storage'

import { ConnectionForm, type ConnectionFormData } from './connection-form'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { docsSiteUrl } from '@/lib/docs-site'
import { useFeaturePermissions } from '@/lib/feature-permissions/context'
import { useBrowserConnections } from '@/lib/hooks/use-browser-connections'
import {
  useUserConnections,
  useUserConnectionsMutations,
} from '@/lib/hooks/use-user-connections'
import { usePathname, useRouter, useSearchParams } from '@/lib/next-compat'
import { buildUrl } from '@/lib/url/url-builder'

interface AddHostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddHostDialog({ open, onOpenChange }: AddHostDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { config } = useFeaturePermissions()
  const { addConnection } = useBrowserConnections()
  const { createConnection } = useUserConnectionsMutations()
  const { refetch: refetchDb, isSignedIn } = useUserConnections()
  const [storageMode, setStorageMode] = useState<HostStorageMode>('browser')

  const dbStorageConfigured = config.userConnections?.dbStorageEnabled === true
  const dbStorageEnabled = dbStorageConfigured && isSignedIn

  const handleSave = async (data: ConnectionFormData) => {
    if (storageMode === 'database' && dbStorageEnabled) {
      const result = await createConnection(data)
      const hostId = result.data.hostId
      await refetchDb()
      if (hostId !== undefined) {
        const url = buildUrl(pathname, { host: hostId }, searchParams)
        router.push(url)
      }
    } else {
      const created = addConnection(data)
      const url = buildUrl(pathname, { host: created.hostId }, searchParams)
      router.push(url)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add ClickHouse host</DialogTitle>
          <DialogDescription>
            chmonitor needs a user with <code>SELECT</code> on{' '}
            <code>system.*</code>. See{' '}
            <a
              href={docsSiteUrl('getting-started/clickhouse-requirements')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              required permissions &amp; firewall setup
            </a>{' '}
            for grants and how to allowlist the Cloud connection.
          </DialogDescription>
        </DialogHeader>

        {!isSignedIn && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-300">
            <p className="font-medium">Sign in for more</p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-400">
              Server storage is disabled on this deployment.{' '}
              <a
                href={docsSiteUrl('features/user-connections')}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
              >
                Enable user connections
              </a>
              . Sign in to select your plan or join an organization to get
              access to your team&apos;s clusters.
            </p>
          </div>
        )}

        <ConnectionForm
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
          storageMode={storageMode}
          onStorageModeChange={setStorageMode}
          dbStorageEnabled={dbStorageEnabled}
          dbStorageRequiresSignIn={dbStorageConfigured && !isSignedIn}
        />
      </DialogContent>
    </Dialog>
  )
}
