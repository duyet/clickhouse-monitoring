import { AGENT_FEATURE_PERMISSION } from '@/lib/feature-permissions/permissions'
import { authorizeFeatureRequest } from '@/lib/feature-permissions/server'

export async function authorizeAgentApiRequest(
  request: Request
): Promise<Response | null> {
  return authorizeFeatureRequest(AGENT_FEATURE_PERMISSION, request, {
    allowAgentBearerToken: true,
  })
}
