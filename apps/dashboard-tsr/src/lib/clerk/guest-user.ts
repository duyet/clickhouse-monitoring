/**
 * Guest user constant for unauthenticated state.
 *
 * When Clerk authentication is disabled or user is not signed in,
 * this default guest user object is used for UI display purposes.
 */
export const GUEST_USER = {
  name: 'Guest',
  email: 'guest@local',
  avatar: '',
} as const

export type GuestUser = typeof GUEST_USER
