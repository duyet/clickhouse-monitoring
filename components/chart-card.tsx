import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'

interface ChartCardProps {
  title?: string | React.ReactNode
  children: string | React.ReactNode
  className?: string
}

export function ChartCard({ title, className, children }: ChartCardProps) {
  return (
    <Card className={className}>
      {title ? (
        <CardHeader className="p-2">
          <CardDescription>{title}</CardDescription>
        </CardHeader>
      ) : null}

      <CardContent className="p-2">{children}</CardContent>
    </Card>
  )
}
