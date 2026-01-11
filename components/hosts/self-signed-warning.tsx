'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SelfSignedWarningProps {
  /**
   * Whether the dialog is open
   */
  open: boolean
  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void
  /**
   * Callback when user confirms to proceed
   */
  onConfirm: () => void
  /**
   * The host URL with the self-signed certificate
   */
  hostUrl: string
}

/**
 * Self-Signed Warning Component
 *
 * Displays a warning dialog when a host has a self-signed certificate.
 * Users can choose to proceed anyway or cancel.
 */
export function SelfSignedWarning({
  open,
  onOpenChange,
  onConfirm,
  hostUrl,
}: SelfSignedWarningProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Self-Signed Certificate Detected
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                The host at <code className="font-mono text-sm">{hostUrl}</code>{' '}
                is using a self-signed or untrusted SSL certificate.
              </p>
              <div className="rounded-md bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                <p className="font-medium">Security Warning</p>
                <p className="mt-1 text-sm">
                  Self-signed certificates cannot be verified by a trusted
                  certificate authority. This could indicate a misconfigured
                  server or, in rare cases, a man-in-the-middle attack.
                </p>
              </div>
              <p>
                Only proceed if you trust this host and understand the security
                implications.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
