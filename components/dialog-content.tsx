import { CodeIcon } from 'lucide-react'
import { memo, useMemo } from 'react'

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
}: DialogContentProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <UIDialogContent className={cn('max-w-[90vw] min-w-80 sm:min-w-96', contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-auto">{content}</div>
      </UIDialogContent>
    </Dialog>
  )
})
