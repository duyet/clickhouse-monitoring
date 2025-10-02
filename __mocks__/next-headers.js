// Mock Next.js headers to prevent hanging in Jest
const mockCookies = jest.fn(() => ({
  get: jest.fn(() => ({ value: '0' })),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
  getAll: jest.fn(() => []),
}));

const mockHeaders = jest.fn(() => ({
  get: jest.fn(() => null),
  set: jest.fn(),
  delete: jest.fn(),
  has: jest.fn(() => false),
  entries: jest.fn(() => []),
}));

module.exports = {
  cookies: mockCookies,
  headers: mockHeaders,
  draftMode: jest.fn(() => ({ isEnabled: false })),
};