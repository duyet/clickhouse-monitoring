import { betterAuth } from 'better-auth'
import { db } from '../db'

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  rateLimit: {
    enabled: true,
    window: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  plugins: [
    // Add rate limiting plugin
    {
      id: 'rate-limit',
      hooks: {
        before: [
          {
            handler: async (ctx) => {
              // Custom rate limiting logic can be added here
            },
          },
        ],
      },
    },
  ],
})