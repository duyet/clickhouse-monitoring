'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Root page - client-side redirect to /overview?host=0
 *
 * This is a fully static site. No SSR, no middleware, no server components.
 * Uses client-side redirect for static compatibility.
 */
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/overview?host=0')
  }, [router])

  return null
}
