import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/resizable'
import { cn } from '@/lib/utils'

type Params = Promise<{
  host: number
  database: string
  table: string
}>

interface TableListProps {
  params: Params
  nav: React.ReactNode
  children: React.ReactNode
}

export const revalidate = 600

export default async function TableListPage({ nav, children }: TableListProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full min-h-screen items-stretch gap-4"
    >
      <ResizablePanel
        defaultSize={10}
        collapsible={true}
        minSize={5}
        maxSize={25}
        className={cn('min-w-[35px] transition-all duration-300 ease-in-out')}
      >
        <div>{nav}</div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel minSize={30} defaultSize={90}>
        <div>{children}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
