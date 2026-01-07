// Mock Next.js headers to prevent hanging in tests
// Bun supports jest.fn() natively for compatibility
import { jest } from 'bun:test'

const mockCookies = jest.fn(() => ({
  get: jest.fn(() => ({ value: '0' })),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
  getAll: jest.fn(() => []),
}))

const mockHeaders = jest.fn(() => ({
  get: jest.fn(() => null),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
  entries: jest.fn(() => []),
}))

const draftMode = jest.fn(() => ({ isEnabled: false }))

const cookies = mockCookies
const headers = mockHeaders

// Export for ES modules
export { cookies, headers, draftMode }

// Export default for CommonJS compatibility
export default {
  cookies: mockCookies,
  headers: mockHeaders,
  draftMode,
}
