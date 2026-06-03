import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

// Component is intentionally not exported — enables Start's automatic
// code-splitting. Tailwind utility classes prove the v4 pipeline works.
function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-50">
      <h1 className="text-4xl font-bold">Hello from TanStack Start</h1>
      <p className="text-zinc-400">
        chmonitor <code>dashboard-tsr</code> on Cloudflare Workers
      </p>
      <a className="text-sky-400 underline" href="/api/hello">
        GET /api/hello
      </a>
    </main>
  )
}
