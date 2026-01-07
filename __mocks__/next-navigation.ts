// Mock Next.js navigation to prevent hanging in tests
// Bun supports jest.fn() natively for compatibility
import { jest } from 'bun:test'

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
}

const useRouter = jest.fn(() => mockRouter)
const usePathname = jest.fn(() => '/')
const useSearchParams = jest.fn(() => new URLSearchParams())
const useParams = jest.fn(() => ({}))
const redirect = jest.fn()
const permanentRedirect = jest.fn()
const notFound = jest.fn()

// Export for ES modules
export {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  permanentRedirect,
  notFound,
}

// Export default for CommonJS compatibility
export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  permanentRedirect,
  notFound,
}
