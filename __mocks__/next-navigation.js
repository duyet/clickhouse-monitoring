// Mock Next.js navigation to prevent hanging in Jest
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

const useRouter = jest.fn(() => mockRouter);
const usePathname = jest.fn(() => '/');
const useSearchParams = jest.fn(() => new URLSearchParams());
const useParams = jest.fn(() => ({}));
const redirect = jest.fn();
const permanentRedirect = jest.fn();
const notFound = jest.fn();

module.exports = {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  permanentRedirect,
  notFound,
};