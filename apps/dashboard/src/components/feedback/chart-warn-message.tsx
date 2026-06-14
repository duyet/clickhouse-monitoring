import { TriangleAlert } from 'lucide-react'
export const ChartWarnMessage = function ChartWarnMessage({
  children,
}: {
  children: string | React.ReactNode
}) {
  return (
    <div className="mb-2 inline-flex items-center gap-2 text-sm">
      <TriangleAlert className="size-4" />
      {children}
    </div>
  )
}
