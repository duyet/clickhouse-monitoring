import { CodeIcon } from 'lucide-react'

import { Button } from '@/components/ui'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent as UIDialogContent,
} from '@/components/ui'
import { cn } from '@/lib/utils'

export interface DialogContentProps {
  button?: React.ReactNode
  title?: string
  description?: string
  content: string | React.ReactNode
  contentClassName?: string
}

export function DialogContent({
  button = (
    <Button
      variant="outline"
      className="ml-auto"
      aria-label="Show SQL"
      title="Show SQL for this table"
    >
      <CodeIcon className="size-4" />
    </Button>
  ),
  title = '',
  description = '',
  content = '',
  contentClassName,
}: DialogContentProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <UIDialogContent className={cn('max-w-fit min-w-96', contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="w-fit overflow-auto" >
          {content}
        </div>
      </UIDialogContent>
    </Dialog>
  )
}
