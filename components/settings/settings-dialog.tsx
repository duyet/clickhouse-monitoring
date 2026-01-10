'use client'

import { Settings } from 'lucide-react'

import { SettingsForm } from './settings-form'
import * as React from 'react'
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

/**
 * Convert ReactNode to a type compatible with Radix UI components
 * Converts bigint to string since it's not supported in React 19's ReactNode
 */
function sanitizeReactNode(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'bigint') {
    return node.toString()
  }
  if (typeof node === 'object' && node !== null) {
    if (Array.isArray(node)) {
      return node.map(sanitizeReactNode)
    }
    // Handle React elements
    if (React.isValidElement(node)) {
      // Recursively sanitize children
      const props = node.props as { children?: React.ReactNode }
      if (props.children) {
        return React.cloneElement(node, {}, sanitizeReactNode(props.children))
      }
      return node
    }
  }
  return node
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

  // Sanitize children to handle potential bigint values
  const sanitizedChildren = sanitizeReactNode(children)

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange || setInternalOpen

  // If using controlled mode, don't render DialogTrigger
  const isControlled = controlledOpen !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {(sanitizedChildren as any) || (
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
