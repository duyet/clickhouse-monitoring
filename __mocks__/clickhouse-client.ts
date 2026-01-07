// Mock ClickHouse client to prevent hanging
// Bun supports jest.fn() natively for compatibility
import { jest } from 'bun:test'

type MockData = { data: unknown[] }
type MockClient = {
  query: ReturnType<typeof jest.fn<Promise<MockData>>>
  close: ReturnType<typeof jest.fn<Promise<void>>>
  ping: ReturnType<typeof jest.fn<Promise<void>>>
}

const mockClient: MockClient = {
  query: jest.fn(() => Promise.resolve({ data: [] })),
  close: jest.fn(() => Promise.resolve()),
  ping: jest.fn(() => Promise.resolve()),
}

const createClient = jest.fn(() => mockClient)

export { createClient, mockClient as __mockClient }
