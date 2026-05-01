import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params
  const safePath = params.path
    .filter((part) => part !== '..' && part !== '.')
    .map(encodeURIComponent)
    .join('/')

  return NextResponse.redirect(
    new URL(`/docs-assets/${safePath}`, _request.url)
  )
}
