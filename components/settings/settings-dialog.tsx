'use client'

import { Settings } from 'lucide-react'

import { SettingsForm } from './settings-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

interface SettingsDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SettingsDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SettingsDialogProps) {
  const safeChildren =
    children && typeof children !== 'bigint' && children !== true
      ? children
      : undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const { settings, updateSettings } = useUserSettings()

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  // If using controlled mode, don't render DialogTrigger
  const isControlled = controlledOpen !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {safeChildren ? (
            <div>{safeChildren}</div>
          ) : (
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <SettingsForm
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
