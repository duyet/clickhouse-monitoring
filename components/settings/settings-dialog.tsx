'use client'

import { Settings } from 'lucide-react'

import { SettingsForm } from './settings-form'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useUserSettings } from '@/lib/hooks/use-user-settings'

// Convert bigint values in ReactNode to strings for React 19 compatibility
function convertReactNodeToString(
  node: React.ReactNode
): string | React.ReactElement | null {
  if (typeof node === 'bigint') {
    return String(node)
  }
  if (typeof node === 'string') {
    return node
  }
  if (typeof node === 'number') {
    return String(node)
  }
  if (typeof node === 'boolean') {
    return node ? 'true' : ''
  }
  if (node == null) {
    return null
  }
  if (Array.isArray(node)) {
    // Return array of converted children - filter out nulls that might cause issues
    const converted = node
      .map(convertReactNodeToString)
      .filter((n) => n !== null && n !== '')
    return converted.length > 0 ? <>{converted}</> : null
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return React.cloneElement(
      element,
      {},
      convertReactNodeToString(element.props.children)
    )
  }
  // Handle other types that might slip through
  return String(node)
}

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
  const [internalOpen, setInternalOpen] = useState(false)
  const { settings, updateSettings } = useUserSettings()

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  // If using controlled mode, don't render DialogTrigger
  const isControlled = controlledOpen !== undefined

  // Convert bigint values to strings for React 19 compatibility
  const safeChildren = convertReactNodeToString(children)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {
            (safeChildren || (
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            )) as any
          }
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
