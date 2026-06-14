// Empty stub for the node @clickhouse/client on Cloudflare Workers.
// clickhouse-client.ts statically imports `createClient` from it, but only
// invokes it on the web:false branch — never reached because this app forces
// web:true (the fetch-based @clickhouse/client-web). The throw guards against
// an accidental node-client code path on the edge.
export function createClient(): never {
  throw new Error(
    'node @clickhouse/client is unavailable on Cloudflare Workers; use web:true (createClientWeb)'
  )
}
