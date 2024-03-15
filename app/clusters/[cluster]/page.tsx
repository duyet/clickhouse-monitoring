import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    cluster: string
  }
}

export default async function ClusterPage({ params: { cluster } }: PageProps) {
  redirect(`/clusters/${cluster}/replicas-status`)
}
