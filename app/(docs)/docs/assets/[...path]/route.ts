import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params
  const safePath = params.path
    .filter((part) => part !== '..' && part !== '.')
    .map(encodeURIComponent)
    .join('/')

  if (!safePath) {
    return new NextResponse('Invalid docs asset path', { status: 400 })
  }

  return NextResponse.redirect(new URL(`/docs-assets/${safePath}`, request.url))
}
