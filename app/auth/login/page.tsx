'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { Link } from '@/components/ui/link'
import { useAuthState } from '@/lib/auth/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const [showSuccess, setShowSuccess] = useState(false)

  const { user, isAuthenticated } = useAuthState()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (message === 'registration-success') {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8">
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300">
              Registration successful! Please sign in to continue.
            </p>
          </div>
        )}

        <LoginForm />

        <div className="mt-6 text-center text-sm">
          <p>
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}