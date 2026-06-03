import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { apiFetch } from '@/lib/swr/api-fetch'
import { throwIfNotOk } from '@/lib/swr/fetch-error'
import { useHostId } from '@/lib/swr/use-host'

interface HostInfo {
  id: number
  name: string
  host: string
}

export const Route = createFileRoute('/(dashboard)/overview')({
  component: OverviewPage,
})

// Foundation placeholder: proves QueryProvider + useHostId + the API binding
// work end-to-end. Static structure prerenders; the host list hydrates client
// side via TanStack Query against /api/v1/hosts.
function OverviewPage() {
  const hostId = useHostId()
  const { data, isPending, error } = useQuery<HostInfo[], Error>({
    queryKey: ['/api/v1/hosts'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/hosts')
      await throwIfNotOk(res, 'Failed to fetch hosts')
      return res.json() as Promise<HostInfo[]>
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Overview</h1>
      <p className="text-zinc-500">Active host: {hostId}</p>
      {isPending && <p className="text-zinc-400">Loading hosts…</p>}
      {error && <p className="text-red-500">{error.message}</p>}
      {data && (
        <ul className="flex flex-col gap-1">
          {data.map((h) => (
            <li key={h.id}>
              #{h.id} · {h.name} · {h.host}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
