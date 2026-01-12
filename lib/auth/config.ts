import { betterAuth } from 'better-auth'
import { sqlite } from 'better-auth/adapters/sqlite'
import { postgres } from 'better-auth/adapters/postgres'

export const auth = betterAuth({
  database:
    process.env.DB_DIALECT === 'postgres'
      ? postgres(process.env.DATABASE_URL!, {
          provider: 'pg',
        })
      : sqlite(process.env.DATABASE_URL || './data/app.db'),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  rateLimit: {
    enabled: true,
    window: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      cookieCacheTTL: 60 * 60 * 1000, // 1 hour
    },
  },
})

export type Session = typeof auth.$Infer.Session
