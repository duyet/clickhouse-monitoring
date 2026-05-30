/**
 * @chm/mcp-server
 *
 * MCP (Model Context Protocol) server for chmonitor. Provides the
 * server factory, auth helpers, and tool metadata shared between the Next.js
 * app routes and the standalone Cloudflare MCP worker.
 */

// Auth helpers
export {
  type ApiKeyVerificationResult,
  apiKeyAuthEnabled,
  issueApiKey,
  verifyApiKey,
} from './auth/api-key'
export { getBearerToken } from './auth/bearer-token'
// Tool metadata + types
export {
  EXAMPLE_PROMPTS,
  getToolMetadata,
  getToolsByCategory,
  MCP_TOOL_CATEGORIES,
  MCP_TOOLS,
  type McpResource,
  type McpServerInfo,
  type McpTool,
  type McpToolCategory,
  type McpToolCategoryInfo,
  type McpToolParam,
} from './data/mcp-tools-data'
// Server factory
export { createMcpServer } from './server'
