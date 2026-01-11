import { CodeIcon } from 'lucide-react'

import { isValidElement, memo } from 'react'
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
  // Temporarily disabled due to React v19 bigint compatibility issues
  // See: https://github.com/duyet/clickhouse-monitoring/issues/705
  // TODO: Re-enable when React fixes bigint support or when we have a proper solution

  return (
    <div>
      {/* Temporarily disabled dialog */}
      <button className="hidden">{button}</button>
    </div>
  )

  // // Convert bigint to string for React v19 compatibility
  // const safeButton = isValidElement(button)
  //   ? button
  //   : typeof button === 'bigint'
  //     ? button.toString()
  //     : button

  // // Convert content as well
  // const safeContent = isValidElement(content)
  //   ? content
  //   : typeof content === 'bigint'
  //     ? content.toString()
  //     : content

  // return (
  //   <Dialog>
  //     <DialogTrigger asChild>{safeButton}</DialogTrigger>
  //     <UIDialogContent
  //       className={cn(
  //         'max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] min-w-80',
  //         contentClassName
  //       )}
  //     >
  //       <DialogHeader className="-mx-6 -mt-6 gap-0.5 rounded-t-lg px-4 py-2">
  //         <div className="flex items-start justify-between gap-2 pr-6">
  //           <div className="flex flex-col gap-0.5">
  //             <DialogTitle className="text-sm">{title}</DialogTitle>
  //             <DialogDescription className="text-sx text-muted-foreground">
  //               {description}
  //             </DialogDescription>
  //           </div>
  //           {headerActions && (
  //             <div className="flex items-center gap-2 shrink-0">
  //               {headerActions}
  //             </div>
  //           )}
  //         </div>
  //       </DialogHeader>
  //       <div className="max-h-[80vh] overflow-auto">{safeContent}</div>
  //     </UIDialogContent>
  //   </Dialog>
  // )
})
