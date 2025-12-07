import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/resizable'

interface LayoutProps {
  params: Promise<{
    host: string
    database: string
  }>
  nav: React.ReactNode
  children: React.ReactNode
}

export const revalidate = 600

export default async function DatabaseLayout({ nav, children }: LayoutProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full min-h-screen items-stretch"
    >
      <ResizablePanel
        defaultSize={17}
        minSize={17}
        maxSize={35}
        className="bg-sidebar rounded-l"
      >
        {nav}
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel minSize={30} defaultSize={90} className="p-4">
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
