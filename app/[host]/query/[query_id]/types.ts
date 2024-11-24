export interface PageProps {
  params: Promise<{
    query_id: string
  }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
