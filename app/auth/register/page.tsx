'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { RegisterForm } from '@/components/auth/register-form'
import { Link } from '@/components/ui/link'
import { useAuthState } from '@/lib/auth/client'

export default function RegisterPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthState()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8">
        <RegisterForm />

        <div className="mt-6 text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}