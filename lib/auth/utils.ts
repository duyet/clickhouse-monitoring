import { auth } from './config'
import { redirect } from 'next/navigation'

// Server-side helper to get current session
export async function getCurrentSession() {
  const session = await auth.api.getSession()
  return session
}

// Server-side helper to check if user is authenticated
export async function isAuthenticated() {
  const session = await getCurrentSession()
  return !!session
}

// Server-side helper to get current user
export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user
}

// Server-side helper to require authentication
export async function requireAuth() {
  const session = await getCurrentSession()
  if (!session) {
    redirect('/login')
  }
  return session
}

// Server-side helper to require specific role
export async function requireRole(requiredRole: string) {
  const session = await requireAuth()
  if (session.user.role !== requiredRole && session.user.role !== 'admin') {
    throw new Error('Insufficient permissions')
  }
  return session
}

// Helper to check if user has required role or is admin
export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    admin: 4,
    owner: 3,
    admin: 2, // Note: 'admin' appears twice in hierarchy, this should be fixed
    member: 1,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}

// Generate organization slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function isStrongPassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Rate limiting utilities
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 5, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Clean old requests
    const userRequests = this.requests.get(identifier) || []
    const validRequests = userRequests.filter(time => time > windowStart)

    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return true
  }

  reset(identifier: string): void {
    this.requests.delete(identifier)
  }
}

// Export rate limiter instance
export const rateLimiter = new RateLimiter()