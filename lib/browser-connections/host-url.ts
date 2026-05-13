import { Address4, Address6 } from 'ip-address'

const INTERNAL_ADDRESS_ERROR =
  'Connections to internal addresses are not allowed.'

/**
 * Returns an error string if the ClickHouse host URL is invalid or internal.
 * Returns null when the host is safe to use.
 */
export function validateHostUrl(host: string): string | null {
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

  return null
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
