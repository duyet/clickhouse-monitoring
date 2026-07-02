/**
 * DDL confirm dialog — shows the generated DDL and executes it on confirm.
 * Shared by every RBAC management operation.
 */

import { ExclamationTriangleIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  ddl: string
  pending: boolean
  statusMessage: string | null
  statusIsError: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  ddl,
  pending,
  statusMessage,
  statusIsError,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExclamationTriangleIcon className="size-4 text-amber-500" />
            Confirm ClickHouse operation
          </DialogTitle>
          <DialogDescription>
            This DDL will be executed directly on the connected ClickHouse host.
            Review it carefully before proceeding.
          </DialogDescription>
        </DialogHeader>

        <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 font-mono text-sm">
          <code>{ddl}</code>
        </pre>

        {statusMessage && (
          <p
            className={
              statusIsError
                ? 'text-sm text-destructive'
                : 'text-sm text-green-600 dark:text-green-400'
            }
          >
            {statusMessage}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? 'Executing…' : 'Execute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
