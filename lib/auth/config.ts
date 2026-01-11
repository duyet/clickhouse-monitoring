/**
 * Better Auth configuration with OAuth providers and security settings
 */

import { betterAuth } from 'better-auth'
import { env } from '../env'
import { db } from '../db'
import { encrypt, decrypt } from '../encryption'

// Rate limiting configuration
const rateLimit = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per window
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1, // 1 registration per hour
  },
}

export const auth = betterAuth({
  database: db.dbInstance,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can be enabled later
    maxAttempts: rateLimit.login.max,
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 7 * 24 * 60 * 60, // Update session after 7 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  rateLimit,
  providers: {
    // GitHub OAuth
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    }),
    // Google OAuth
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    }),
  },
  advanced: {
    // Rate limiting middleware
    plugins: {
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
      },
    },
    // Session configuration for multi-tenancy
    session: {
      cookiePrefix: 'chm_',
      cookieName: 'chm_session',
      cookieOptions: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      },
    },
  },
  // Custom hooks for encryption and audit logging
  hooks: {
    // Encrypt sensitive host credentials before saving
    beforeSaveUser: async (user) => {
      // No encryption needed for user data in this implementation
      return user
    },
    // Audit logging for auth events
    afterLogin: async (session, user) => {
      try {
        await db.logAuditEvent({
          userId: user.id,
          action: 'user.login',
          resourceType: 'user',
          resourceId: user.id,
          success: true,
          ipAddress: '', // Will be set by middleware
          userAgent: '', // Will be set by middleware
          metadata: {
            method: session?.provider || 'email',
          },
        })
      } catch (error) {
        console.error('Failed to log login event:', error)
      }
      return session
    },
    // Handle logout events
    afterLogout: async (session, user) => {
      if (user) {
        try {
          await db.logAuditEvent({
            userId: user.id,
            action: 'user.logout',
            resourceType: 'user',
            resourceId: user.id,
            success: true,
            ipAddress: '',
            userAgent: '',
          })
        } catch (error) {
          console.error('Failed to log logout event:', error)
        }
      }
    },
    // Handle session expiry
    beforeSessionCreated: async (session) => {
      // Set session expiry notification logic here
      return session
    },
  },
  // Database migrations
  databaseHooks: {
    user: {
      // Custom user transformations
    },
    session: {
      // Custom session transformations
    },
  },
})

// Auth helper functions
export const authHelpers = {
  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string) {
    const user = await db.findUserById(userId)
    if (!user) return []

    const memberships = await db.dbInstance.query.organizationMembers.findMany({
      where: (members, { eq }) => eq(members.userId, userId),
      with: { organization: true },
    })

    return memberships.map(m => ({
      ...m.organization,
      role: m.role,
      joinedAt: m.joinedAt,
    }))
  },

  /**
   * Check if user is member of organization
   */
  async isOrganizationMember(userId: string, organizationId: string) {
    const result = await db.dbInstance.query.organizationMembers.findFirst({
      where: (members, { and, eq }) => and(
        eq(members.userId, userId),
        eq(members.organizationId, organizationId)
      ),
    })
    return !!result
  },

  /**
   * Check if user has permission for action
   */
  async hasPermission(userId: string, organizationId: string, permission: 'read' | 'write' | 'admin'): Promise<boolean> {
    const membership = await db.dbInstance.query.organizationMembers.findFirst({
      where: (members, { and, eq }) => and(
        eq(members.userId, userId),
        eq(members.organizationId, organizationId)
      ),
    })

    if (!membership) return false

    return {
      read: ['owner', 'admin', 'member'].includes(membership.role),
      write: ['owner', 'admin'].includes(membership.role),
      admin: membership.role === 'owner',
    }[permission]
  },

  /**
   * Generate session metadata
   */
  getSessionMetadata(request: Request) {
    return {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }
  },
}

export default auth