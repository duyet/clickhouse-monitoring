import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db, dbSchema } from "@/lib/db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    schema: dbSchema,
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      // TODO: Implement email sending
      console.log(`Password reset link for ${user.email}: ${url}`)
    },
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: Implement email sending
      console.log(`Verification link for ${user.email}: ${url}`)
    },
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
  advanced: {
    crossSubdomainCookies: {
      enabled: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  rateLimit: {
    enabled: true,
    window: 60 * 1000, // 1 minute
    max: 10, // 10 attempts per window
  },
  logger: {
    enabled: process.env.NODE_ENV === "development",
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.User
export type Account = typeof auth.$Infer.Account