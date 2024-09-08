import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    cluster: string
  }
}

// Redirects to the replicas status page.
export default async function ClusterPage({ params: { cluster } }: PageProps) {
  redirect(`/clusters/${cluster}/replicas-status`)
}
