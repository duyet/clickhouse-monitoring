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

export function formatReadableQuantity(quantity: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    notation: 'compact',
    compactDisplay: 'short',
  }).format(quantity)
}
