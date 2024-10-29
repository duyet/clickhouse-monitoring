import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{
    cluster: string
  }>
}

// Redirects to the replicas status page.
export default async function ClusterPage({ params }: PageProps) {
  const { cluster } = await params

  redirect(`/clusters/${cluster}/replicas-status`)
}
