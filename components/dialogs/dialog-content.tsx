import { CodeIcon } from 'lucide-react'

import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent as UIDialogContent,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface DialogContentProps {
  button?: React.ReactNode
  title?: string
  description?: string
  content: string | React.ReactNode
  contentClassName?: string
  /** Actions to display in the header (right side) */
  headerActions?: React.ReactNode
}

// Default button - defined outside component to avoid re-creation
const defaultButton = (
  <Button
    variant="outline"
    className="ml-auto"
    aria-label="Show SQL"
    title="Show SQL for this table"
  >
    <CodeIcon className="size-4" />
  </Button>
)

export const DialogContent = memo(function DialogContent({
  button = defaultButton,
  title = '',
  description = '',
  content = '',
  contentClassName,
  headerActions,
}: DialogContentProps) {
  // Convert bigint values to strings for React 19 compatibility
  const safeButton = convertReactNodeToString(button)
  const safeContent = convertReactNodeToString(content)
  const safeHeaderActions = convertReactNodeToString(headerActions)

  return (
    <Dialog>
      <DialogTrigger asChild>{safeButton as any}</DialogTrigger>
      <UIDialogContent
        className={cn(
          'max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] min-w-80',
          contentClassName
        )}
      >
        <DialogHeader className="-mx-6 -mt-6 gap-0.5 rounded-t-lg px-4 py-2">
          <div className="flex items-start justify-between gap-2 pr-6">
            <div className="flex flex-col gap-0.5">
              <DialogTitle className="text-sm">{title}</DialogTitle>
              <DialogDescription className="text-sx text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
            {safeHeaderActions && (
              <div className="flex items-center gap-2 shrink-0">
                {safeHeaderActions as any}
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-auto">{safeContent as any}</div>
      </UIDialogContent>
    </Dialog>
  )
})

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
