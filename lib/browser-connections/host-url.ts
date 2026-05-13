import { Address4, Address6 } from 'ip-address'

const INTERNAL_ADDRESS_ERROR =
  'Connections to internal addresses are not allowed.'

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
    const addresses = await resolveHostAddresses(hostname)
    if (addresses.some(isInternalIp)) {
      return INTERNAL_ADDRESS_ERROR
    }
  }

  return null
}

async function resolveDnsAddresses(hostname: string) {
  const { lookup } = await import('node:dns/promises')
  const records = await lookup(hostname, { all: true, verbatim: true })

  return records.map((record) => record.address)
}

function isIpLiteral(hostname: string) {
  return isAddress4(hostname) || isAddress6(hostname)
}

function isAddress4(hostname: string) {
  try {
    new Address4(hostname)
    return true
  } catch {
    return false
  }
}

function isAddress6(hostname: string) {
  try {
    new Address6(hostname)
    return true
  } catch {
    return false
  }
}

function isInternalIp(hostname: string) {
  try {
    const address = new Address4(hostname)

    return (
      address.isLoopback() ||
      address.isPrivate() ||
      address.isLinkLocal() ||
      address.isUnspecified() ||
      address.isMulticast()
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
          mapped4.isMulticast()))
    )
  } catch {
    // Not IPv6.
  }

  return false
}
