/**
 * Jest setup for hostId validation tests
 * Configures environment and global settings for host switching tests
 */

// Mock getHostIdCookie for tests
global.mockGetHostIdCookie = jest.fn(() => Promise.resolve('0'))

// Mock fetchData to track hostId parameter usage
global.mockFetchData = jest.fn()

// Setup test data for different hosts
global.mockHostData = {
  '0': {
    queries: [{ id: 1, query: 'SELECT 1', user: 'default' }],
    metrics: { cpu: 45, memory: 60 }
  },
  '1': {
    queries: [{ id: 2, query: 'SELECT 2', user: 'admin' }],
    metrics: { cpu: 30, memory: 75 }
  }
}

// Console warning for missing hostId parameters
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  const message = args.join(' ')
  if (message.includes('fetchData') && message.includes('hostId')) {
    // Track hostId warnings for test assertions
    global.hostIdWarnings = global.hostIdWarnings || []
    global.hostIdWarnings.push(message)
  }
  originalConsoleWarn.apply(console, args)
}

// Reset mocks and warnings before each test
beforeEach(() => {
  global.mockGetHostIdCookie.mockClear()
  global.mockFetchData.mockClear()
  global.hostIdWarnings = []
  
  // Default mock implementation
  global.mockFetchData.mockImplementation(({ hostId = '0', query }) => {
    const hostData = global.mockHostData[hostId] || global.mockHostData['0']
    
    if (query.includes('query_log')) {
      return Promise.resolve({ data: hostData.queries })
    }
    
    if (query.includes('system.metrics')) {
      return Promise.resolve({ data: [hostData.metrics] })
    }
    
    return Promise.resolve({ data: [] })
  })
})

// Utility functions for tests
global.testUtils = {
  // Simulate host switching
  switchHost: (newHostId) => {
    global.mockGetHostIdCookie.mockResolvedValueOnce(newHostId)
    return newHostId
  },
  
  // Check if fetchData was called with correct hostId
  assertHostIdUsed: (expectedHostId) => {
    const calls = global.mockFetchData.mock.calls
    const hasCorrectHostId = calls.some(call => 
      call[0] && call[0].hostId === expectedHostId
    )
    
    if (!hasCorrectHostId) {
      throw new Error(
        `Expected fetchData to be called with hostId: ${expectedHostId}, ` +
        `but got calls with hostIds: ${calls.map(c => c[0]?.hostId).join(', ')}`
      )
    }
  },
  
  // Verify no fetchData calls are missing hostId
  assertAllCallsHaveHostId: () => {
    const calls = global.mockFetchData.mock.calls
    const callsWithoutHostId = calls.filter(call => 
      !call[0] || typeof call[0].hostId === 'undefined'
    )
    
    if (callsWithoutHostId.length > 0) {
      throw new Error(
        `Found ${callsWithoutHostId.length} fetchData calls without hostId parameter. ` +
        'All fetchData calls must include hostId for multi-host support.'
      )
    }
  }
}

// Mock Next.js router for host switching tests
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  pathname: '/0',
  query: { host: '0' },
  asPath: '/0'
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter
}))

// Mock cookies for host selection
const mockCookies = new Map([['hostId', '0']])

global.mockCookies = {
  get: (name) => mockCookies.get(name),
  set: (name, value) => mockCookies.set(name, value),
  clear: () => mockCookies.clear(),
  getAll: () => Object.fromEntries(mockCookies)
}

// Export for use in tests
module.exports = {
  mockGetHostIdCookie: global.mockGetHostIdCookie,
  mockFetchData: global.mockFetchData,
  testUtils: global.testUtils,
  mockCookies: global.mockCookies
}