import { Address4, Address6 } from 'ip-address'

const INTERNAL_ADDRESS_ERROR =
  'Connections to internal addresses are not allowed.'
const DNS_LOOKUP_TIMEOUT_MS = 3000

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

  if (!isIpLiteral(hostname)) {
    let addresses: readonly string[]
    try {
      addresses = await resolveHostAddresses(hostname)
    } catch {
      return INTERNAL_ADDRESS_ERROR
    }

    if (addresses.some(isInternalIp)) {
      return INTERNAL_ADDRESS_ERROR
    }
  }

  return null
}

export function createHostValidationFetch(
  resolveHostAddresses: ResolveHostAddresses = resolveDnsAddresses
): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    const error = await validateHostUrl(url, resolveHostAddresses)
    if (error) {
      throw new Error(error)
    }

    return fetch(input, init)
  }
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

    return (
      address.isLoopback() ||
      address.isPrivate() ||
      address.isLinkLocal() ||
      address.isUnspecified() ||
      address.isMulticast() ||
      address.isCGNAT() ||
      address.isBroadcast()
    )
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
      (mapped4 !== null &&
        (mapped4.isLoopback() ||
          mapped4.isPrivate() ||
          mapped4.isLinkLocal() ||
          mapped4.isUnspecified() ||
          mapped4.isMulticast() ||
          mapped4.isCGNAT() ||
          mapped4.isBroadcast()))
    )
  } catch {
    // Not IPv6.
  }

  return false
}
