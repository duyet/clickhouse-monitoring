export interface PageProps {
  params: Promise<{
    query_id: string
  }>
  searchParams: Promise<{ cluster?: string }>
}
