import { Building2, Sparkles } from 'lucide-react'

import {
  OrganizationProfile,
  useOrganization,
} from '@clerk/tanstack-react-start'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { isClerkEnabled } from '@/lib/clerk/clerk-client'
import { isCloudModeClient } from '@/lib/cloud/cloud-mode'

/**
 * Member management surface. Renders Clerk's <OrganizationProfile/> (members,
 * roles, invitations) when the user has an active organization; otherwise an
 * upgrade prompt, since orgs are provisioned on a paid plan.
 *
 * Clerk imports are static but inert until this renders — and it only renders on
 * the cloud build (the route is cloud-gated in the sidebar), matching the
 * lazy-Clerk pattern used across the app.
 */
export function OrganizationMembers() {
  if (!isClerkEnabled() || !isCloudModeClient()) {
    return <NoOrgState selfHosted />
  }
  return <OrgProfileGate />
}

function OrgProfileGate() {
  const { organization, isLoaded } = useOrganization()

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="bg-muted h-96 animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!organization) {
    return <NoOrgState />
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <OrganizationProfile routing="hash" />
    </div>
  )
}

function NoOrgState({ selfHosted = false }: { selfHosted?: boolean }) {
  return (
    <div className="mx-auto max-w-xl py-16">
      <Card>
        <CardHeader className="items-center text-center">
          <div className="bg-primary/10 mb-2 flex size-12 items-center justify-center rounded-xl">
            <Building2 className="text-primary size-6" />
          </div>
          <CardTitle>No organization yet</CardTitle>
          <CardDescription>
            {selfHosted
              ? 'Organizations are a cloud feature.'
              : 'Upgrade to Pro or Max to create a team workspace — invite members, assign roles, and share your plan.'}
          </CardDescription>
        </CardHeader>
        {!selfHosted && (
          <CardContent className="flex justify-center">
            <Button asChild>
              <a href="/billing">
                <Sparkles className="size-4" /> View plans
              </a>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
