import { redirect } from 'next/navigation'

export default async function Home() {
  redirect('/0/overview')
}
