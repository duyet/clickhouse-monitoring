import { createFileRoute } from '@tanstack/react-router'

import { OrganizationMembers } from '@/components/clerk/organization-members'

/**
 * Organization management — members, roles, invitations.
 *
 * Cloud (SaaS) only and only meaningful once the user is in an organization
 * (orgs are created lazily on a paid upgrade — see the Polar webhook). Renders
 * Clerk's <OrganizationProfile/>, which provides the full members/roles/invite
 * UI out of the box. Free/personal users see a prompt explaining that an org is
 * created when they upgrade.
 */
export const Route = createFileRoute('/(dashboard)/organization')({
  component: OrganizationMembers,
})
