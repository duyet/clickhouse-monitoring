'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppContext } from '@/app/context'

interface ChartCardProps {
  title?: string
  children?: React.ReactNode
}

export async function ChartCard({ title, children }: ChartCardProps) {
  const { interval } = useAppContext()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
