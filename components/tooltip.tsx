import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TooltipProps {
  children: React.ReactNode
  title: string | React.ReactNode
}

export function Tooltip({ children, title }: TooltipProps) {
  return (
    <TooltipProvider>
      <TooltipComponent>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </TooltipComponent>
    </TooltipProvider>
  )
}
