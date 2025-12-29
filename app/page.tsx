import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to overview page with default host
  redirect('/overview?host=0')
}
