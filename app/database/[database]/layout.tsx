import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/resizable'
import { cn } from '@/lib/utils'

interface TableListProps {
  params: {
    database: string
    table: string
  }
  nav: React.ReactNode
  children: React.ReactNode
}

export const revalidate = 600

const defaultLayout = [15, 32 + 48]

export default async function TableListPage({ nav, children }: TableListProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full max-h-[800px] items-stretch gap-4"
    >
      <ResizablePanel
        defaultSize={10}
        collapsible={true}
        minSize={10}
        maxSize={25}
        className={cn('min-w-[50px] transition-all duration-300 ease-in-out')}
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
