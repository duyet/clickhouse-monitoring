'use client'

import dynamic from 'next/dynamic'

const AgentsRuntime = dynamic(
  () =>
    import('@/components/agents/agents-runtime').then(
      (module) => module.AgentsRuntime
    ),
  {
    loading: () => <div className="h-full bg-background" />,
    ssr: false,
  }
)

export function AgentsPageClient() {
  return <AgentsRuntime />
}
