import type { HostStorageMode } from '@/lib/types/host-storage'

import { ConnectionForm, type ConnectionFormData } from './connection-form'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
        </DialogHeader>
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
