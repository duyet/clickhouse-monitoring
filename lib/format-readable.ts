// https://stackoverflow.com/a/18650828
export function formatReadableSize(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = [
    'Bytes',
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
  ]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Format a number to a human readable quantity.
 * For example:
 * formatReadableQuantity(123456789) => 123.5M
 * formatReadableQuantity(123456789, 'short') => 123.5M
 * formatReadableQuantity(123456789, 'long') => 123,456,789
 *
 * @param quantity
 * @param preset 'short' or 'long', defaults to 'short'
 * @returns
 */
export function formatReadableQuantity(
  quantity: number,
  preset: string = 'short'
) {
  const options =
    preset === 'short'
      ? {
          notation: 'compact' as 'compact',
          compactDisplay: 'short' as 'short',
        }
      : {
          notation: 'standard' as 'standard',
        }

  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    ...options,
  }).format(quantity)
}
