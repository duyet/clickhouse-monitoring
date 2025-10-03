export interface PageProps {
  params: Promise<{
    host: string
    query_id: string
  }>
  searchParams: Promise<{ cluster?: string }>
}
