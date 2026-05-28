import { PlugZapIcon } from 'lucide-react'

/** Shown when PEERDB_API_URL is unset and the proxy returns 503. */
export function PeerDBNotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <PlugZapIcon className="size-8 text-muted-foreground" />
      <h2 className="text-lg font-semibold">PeerDB is not configured</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Set <code className="rounded bg-muted px-1">PEERDB_API_URL</code> (and{' '}
        <code className="rounded bg-muted px-1">PEERDB_PASSWORD</code> if your
        PeerDB API requires auth) to point at your PeerDB flow-api, then restart
        the app to monitor mirrors and peers.
      </p>
    </div>
  )
}
