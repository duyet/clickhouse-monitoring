export function rewriteDocsHref(href: string | undefined) {
  if (!href) {
    return href
  }

  if (href.startsWith('/docs') || href.startsWith('#')) {
    return href
  }

  if (href.startsWith('/')) {
    return `/docs${href}`
  }

  return href
}

export function rewriteDocsImageSrc(src: string | undefined) {
  if (!src) {
    return src
  }

  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }

  const filename = src.split('/').filter(Boolean).at(-1)
  if (!filename) {
    return src
  }

  if (src.includes('.github/screenshots')) {
    return `/docs-assets/screenshots/${filename}`
  }

  return `/docs-assets/${filename}`
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}
