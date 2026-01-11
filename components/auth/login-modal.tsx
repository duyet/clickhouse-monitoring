'use client'

import { GitHubIcon, GoogleIcon } from '@/components/icons/oauth-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

export function LoginModal({
  open,
  onOpenChange,
  redirectTo = '/hosts/new',
}: LoginModalProps) {
  function handleSignIn(provider: 'github' | 'google') {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', redirectTo)
    }
    window.location.href = `/api/auth/signin/${provider}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to add hosts</DialogTitle>
          <DialogDescription>
            Create an account to manage your own ClickHouse hosts
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => handleSignIn('github')}
            className="w-full"
            data-testid="github-login"
            aria-label="Sign in with GitHub"
          >
            <GitHubIcon className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSignIn('google')}
            className="w-full"
            data-testid="google-login"
            aria-label="Sign in with Google"
          >
            <GoogleIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
