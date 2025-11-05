import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ host: string }>
}

export default async function HostPage({ params }: PageProps) {
  const { host } = await params

  // Redirect to overview page for the selected host
  redirect(`/${host}/overview`)
}
