import { ResetIcon } from '@radix-ui/react-icons'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ResetColumnOrderButtonProps {
  onReset: () => void
  disabled?: boolean
}

export const ResetColumnOrderButton = memo(function ResetColumnOrderButton({
  onReset,
  disabled = false,
}: ResetColumnOrderButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 sm:size-5 opacity-40 hover:opacity-100 transition-opacity rounded-full"
            onClick={onReset}
            disabled={disabled}
            aria-label="Reset column order"
          >
            <ResetIcon className="size-3 sm:size-3" strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Reset column order to default</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})
