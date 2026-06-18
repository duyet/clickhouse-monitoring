// Empty stub for the node @clickhouse/client.
// clickhouse-client.ts statically imports `createClient` from it, but only
// invokes it on the web:false branch — never reached because getClient()
// defaults to the web client (web !== false; the fetch-based
// @clickhouse/client-web works on both Node and Workers). The throw guards
// against an accidental node-client code path, which has no real impl in this
// app on either build target.
export function createClient(): never {
  throw new Error(
    'node @clickhouse/client is unavailable on Cloudflare Workers; use web:true (createClientWeb)'
  )
}
