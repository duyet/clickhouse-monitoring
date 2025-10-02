// Mock ClickHouse client to prevent hanging
const mockClient = {
  query: jest.fn(() => Promise.resolve({ data: [] })),
  close: jest.fn(() => Promise.resolve()),
  ping: jest.fn(() => Promise.resolve()),
};

const createClient = jest.fn(() => mockClient);

module.exports = {
  createClient,
  __mockClient: mockClient, // Export for test assertions
};