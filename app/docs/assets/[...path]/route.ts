import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { notFound } from 'next/navigation'

const assetRoots = {
  docs: path.join(process.cwd(), 'docs', 'public'),
  screenshots: path.join(process.cwd(), '.github', 'screenshots'),
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params
  const [namespaceOrFile, ...rest] = params.path
  const isScreenshot = namespaceOrFile === 'screenshots'
  const root = isScreenshot ? assetRoots.screenshots : assetRoots.docs
  const assetPath = isScreenshot
    ? path.join(root, ...rest)
    : path.join(root, namespaceOrFile, ...rest)
  const normalizedPath = path.normalize(assetPath)

  if (!normalizedPath.startsWith(root) || !existsSync(normalizedPath)) {
    notFound()
  }

  return new Response(readFileSync(normalizedPath), {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': contentType(normalizedPath),
    },
  })
}

function contentType(filePath: string) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.png':
      return 'image/png'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}
