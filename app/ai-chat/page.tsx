'use client'

import { Suspense } from 'react'
import { ChatInterfaceWithSuspense } from '@/components/ai-chat/chat-interface'
import { Skeleton } from '@/components/ui/skeleton'

function PageSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[calc(100vh-8rem)] w-full" />
    </div>
  )
}

export default function AiChatPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <p className="text-muted-foreground">
          Ask questions in natural language to query ClickHouse
        </p>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <ChatInterfaceWithSuspense />
      </Suspense>
    </div>
  )
}
