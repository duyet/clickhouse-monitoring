import { Address4, Address6 } from 'ip-address'
import { Agent, type Dispatcher } from 'undici'

const INTERNAL_ADDRESS_ERROR =
  'Connections to internal addresses are not allowed.'
const DNS_RESOLUTION_ERROR = 'Unable to resolve host safely.'
const DNS_LOOKUP_TIMEOUT_MS = 3000

type FetchInitWithDispatcher = RequestInit & { dispatcher: Dispatcher }
type ClosableDispatcher = Dispatcher & {
  close?: () => Promise<void> | void
  destroy?: () => void
}

export type ResolveHostAddresses = (
  hostname: string
) => Promise<readonly string[]>

/**
 * Returns an error string if the ClickHouse host URL is invalid or internal.
 * Returns null when the host is safe to use.
 */
export async function validateHostUrl(
  host: string,
  resolveHostAddresses: ResolveHostAddresses = resolveDnsAddresses
): Promise<string | null> {
  const result = await resolveValidatedHostUrl(host, resolveHostAddresses)

  return typeof result === 'string' ? result : null
}

async function resolveValidatedHostUrl(
  host: string,
  resolveHostAddresses: ResolveHostAddresses = resolveDnsAddresses
): Promise<{ url: URL; addresses: readonly string[] } | string> {
  let url: URL
  try {
    url = new URL(host)
  } catch {
    return `Invalid host URL: "${host}". Must be a full URL (e.g., https://my.clickhouse.cloud:8443)`
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return `Unsupported protocol "${url.protocol}". Only http and https are allowed.`
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return INTERNAL_ADDRESS_ERROR
  }

  if (isInternalIp(hostname)) {
    return INTERNAL_ADDRESS_ERROR
  }

  if (isIpLiteral(hostname)) {
    return { url, addresses: [hostname] }
  }

  let addresses: readonly string[]
  try {
    addresses = await resolveHostAddresses(hostname)
  } catch {
    return DNS_RESOLUTION_ERROR
  }

  if (addresses.some(isInternalIp)) {
    return INTERNAL_ADDRESS_ERROR
  }

  if (addresses.length === 0) {
    return INTERNAL_ADDRESS_ERROR
  }

  return { url, addresses }
}

export function createHostValidationFetch(
  resolveHostAddresses: ResolveHostAddresses = resolveDnsAddresses
): typeof fetch {
  return async (input, init) => {
    const result = await resolveValidatedHostUrl(
      getFetchUrl(input),
      resolveHostAddresses
    )

    if (typeof result === 'string') {
      throw new Error(result)
    }

    return fetchPinnedToValidatedAddresses(input, init, result.addresses)
  }
}

async function fetchPinnedToValidatedAddresses(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  addresses: readonly string[]
) {
  let lastError: unknown
  const addressesToTry = isIdempotentFetch(input, init)
    ? addresses
    : addresses.slice(0, 1)

  for (const address of addressesToTry) {
    const dispatcher = createPinnedDispatcher(address)
    const pinnedInit = { dispatcher } satisfies FetchInitWithDispatcher
    const undiciFetch = fetch as unknown as (
      input: Parameters<typeof fetch>[0],
      init: FetchInitWithDispatcher
    ) => Promise<Response>

    try {
      const response =
        input instanceof Request
          ? await undiciFetch(new Request(input, init), pinnedInit)
          : await undiciFetch(input, {
              ...init,
              dispatcher,
            } as FetchInitWithDispatcher)

      return wrapResponseWithDispatcherCleanup(response, dispatcher)
    } catch (error) {
      closeDispatcher(dispatcher)
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to connect to validated host addresses.')
}

function isIdempotentFetch(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1]
) {
  const method =
    init?.method ?? (input instanceof Request ? input.method : 'GET')

  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

function wrapResponseWithDispatcherCleanup(
  response: Response,
  dispatcher: Dispatcher
) {
  if (!response.body) {
    closeDispatcher(dispatcher)
    return response
  }

  const body = response.body.pipeThrough(
    new TransformStream({
      flush: () => closeDispatcher(dispatcher),
    })
  )

  return new Response(body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  })
}

function closeDispatcher(dispatcher: Dispatcher) {
  const closable = dispatcher as ClosableDispatcher
  if (typeof closable.close === 'function') {
    void Promise.resolve(closable.close()).catch(() => undefined)
    return
  }

  if (typeof closable.destroy === 'function') {
    closable.destroy()
  }
}

function getFetchUrl(input: Parameters<typeof fetch>[0]) {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url
}

function createPinnedDispatcher(address: string) {
  const family = isAddress6(address) ? 6 : 4

  return new Agent({
    connect: {
      lookup: (_hostname, _options, callback) => {
        callback(null, address, family)
      },
    },
  })
}

async function resolveDnsAddresses(hostname: string) {
  const { lookup } = await import('node:dns/promises')
  const records = await withTimeout(
    lookup(hostname, { all: true, verbatim: true })
  )

  return records.map((record) => record.address)
}

function withTimeout<T>(promise: Promise<T>) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error('DNS lookup timed out')),
      DNS_LOOKUP_TIMEOUT_MS
    )
  })

  return Promise.race([promise, timeoutPromise]).finally(() =>
    timeout ? clearTimeout(timeout) : undefined
  )
}

function isIpLiteral(hostname: string) {
  return isAddress4(hostname) || isAddress6(hostname)
}

function isAddress4(hostname: string) {
  return Address4.isValid(hostname)
}

function isAddress6(hostname: string) {
  return Address6.isValid(hostname)
}

function isInternalIp(hostname: string) {
  try {
    const address = new Address4(hostname)

    return isInternalAddress4(address)
  } catch {
    // Not IPv4.
  }

  try {
    const address = new Address6(hostname)
    const mapped4 = address.isMapped4() ? address.to4() : null

    return (
      address.isLoopback() ||
      address.isULA() ||
      address.isLinkLocal() ||
      address.isUnspecified() ||
      address.isMulticast() ||
      isInternal6to4(address) ||
      isInternalTeredo(address) ||
      (mapped4 !== null && isInternalAddress4(mapped4))
    )
  } catch {
    // Not IPv6.
  }

  return false
}

function isInternalAddress4(address: Address4) {
  return (
    address.isLoopback() ||
    address.isPrivate() ||
    address.isLinkLocal() ||
    address.isUnspecified() ||
    address.isMulticast() ||
    address.isCGNAT() ||
    address.isBroadcast()
  )
}

function isInternal6to4(address: Address6) {
  return (
    address.is6to4() &&
    isInternalAddress4(new Address4(address.inspect6to4().gateway))
  )
}

function isInternalTeredo(address: Address6) {
  return (
    address.isTeredo() &&
    isInternalAddress4(new Address4(address.inspectTeredo().client4))
  )
}
