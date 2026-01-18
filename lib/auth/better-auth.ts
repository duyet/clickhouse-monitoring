/**
 * Better Auth server configuration
 *
 * Provides OAuth authentication (GitHub, Google) with organization plugin
 * for multi-tenant support. Session duration varies by deployment mode.
 *
 * Uses Drizzle adapter to integrate with existing database setup.
 */

import { detectDatabaseAdapter, getDeploymentMode } from './config'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'

/**
 * Session duration configuration based on deployment mode
 * - cloud: 7 days (requires more frequent login for security)
 * - self-hosted: 30 days (users control their security)
 */
function getSessionConfig() {
  const mode = getDeploymentMode()
  const baseDuration = mode === 'cloud' ? 7 : 30 // days

  return {
    expiresIn: baseDuration * 24 * 60 * 60, // Convert to seconds
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  }
}

/**
 * Get Drizzle provider type from database adapter
 */
function getDrizzleProvider(): 'sqlite' | 'pg' {
  const adapter = detectDatabaseAdapter()
  if (adapter === 'postgres') {
    return 'pg'
  }
  // SQLite, D1, LibSQL all use sqlite provider
  return 'sqlite'
}

/**
 * Build social providers configuration
 * Providers are enabled only if their client credentials are set
 */
function getSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> =
    {}

  // GitHub OAuth
  const githubClientId = process.env.AUTH_GITHUB_ID
  const githubClientSecret = process.env.AUTH_GITHUB_SECRET
  if (githubClientId && githubClientSecret) {
    providers.github = {
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }
  }

  // Google OAuth
  const googleClientId = process.env.AUTH_GOOGLE_ID
  const googleClientSecret = process.env.AUTH_GOOGLE_SECRET
  if (googleClientId && googleClientSecret) {
    providers.google = {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }
  }

  return providers
}

/**
 * Generate a slug from a name
 * Used for auto-creating personal organization slugs
 */
function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)

  // Fallback for empty slugs (e.g., names with only special characters)
  if (!slug) {
    return `workspace-${Date.now().toString(36)}`
  }
  return slug
}

/**
 * Create Better Auth instance
 * This is async because we need to await the database connection
 */
async function createAuth() {
  // Dynamic import to avoid issues with static analysis
  const { getDb } = await import('@/lib/db')
  const db = await getDb()

  // Validate AUTH_SECRET in production
  const authSecret = process.env.AUTH_SECRET
  if (process.env.NODE_ENV === 'production' && !authSecret) {
    throw new Error(
      'AUTH_SECRET environment variable is required in production. ' +
        'Generate one with: openssl rand -base64 32'
    )
  }

  return betterAuth({
    // Auth secret for signing tokens - required in production
    secret: authSecret || 'development-secret-do-not-use-in-production',

    // Base URL for OAuth redirects
    baseURL:
      process.env.BETTER_AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000',

    // Database configuration using Drizzle adapter
    database: drizzleAdapter(db, {
      provider: getDrizzleProvider(),
    }),

    // OAuth providers (GitHub, Google) - object format
    socialProviders: getSocialProviders(),

    // Session configuration
    session: getSessionConfig(),

    // Rate limiting
    rateLimit: {
      enabled: true,
      window: 60, // 1 minute
      max: 5, // 5 requests per minute
    },

    // Organization plugin for multi-tenant support
    plugins: [
      organization({
        // Creator gets owner role by default
        creatorRole: 'owner',
        // Allow users to create organizations
        allowUserToCreateOrganization: true,
        // Invitation expires in 7 days
        invitationExpiresIn: 7 * 24 * 60 * 60,
      }),
    ],

    // Database hooks for custom logic
    databaseHooks: {
      user: {
        create: {
          /**
           * Auto-create personal organization on first signup
           * Creates "{username}'s Workspace" as default organization
           */
          after: async (user) => {
            try {
              const authInstance = await getAuth()
              const userName = user.name || user.email?.split('@')[0] || 'User'
              const orgName = `${userName}'s Workspace`
              const orgSlug = generateSlug(`${userName}-workspace`)

              // Create personal organization for the new user
              await authInstance.api.createOrganization({
                body: {
                  name: orgName,
                  slug: orgSlug,
                  userId: user.id,
                },
              })
            } catch (error) {
              // Log but don't fail signup if org creation fails
              console.error('Failed to create personal organization:', error)
            }
          },
        },
      },
    },

    // Advanced security options
    advanced: {
      // Use secure cookies in production
      useSecureCookies: process.env.NODE_ENV === 'production',
    },
  })
}

// Singleton promise for auth instance
let authPromise: ReturnType<typeof createAuth> | null = null

/**
 * Get the Better Auth instance (lazy initialized)
 */
export async function getAuth() {
  if (!authPromise) {
    authPromise = createAuth()
  }
  return authPromise
}

/**
 * Export auth for synchronous access (after initialization)
 * Note: For API routes, use getAuth() instead
 */
export const auth = {
  // Placeholder that will be populated
  api: {} as Awaited<ReturnType<typeof createAuth>>['api'],
  handler: async (request: Request) => {
    const authInstance = await getAuth()
    return authInstance.handler(request)
  },
}

// Re-export types from canonical types.ts
export type { Session, User } from './types'
