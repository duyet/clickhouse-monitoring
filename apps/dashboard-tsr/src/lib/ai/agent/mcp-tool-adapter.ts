/**
 * MCP Tool Adapter (Backward Compatibility Shim)
 *
 * This file maintains backward compatibility after the refactor that replaced
 * the monolithic mcp-tool-adapter.ts with a modular tools system.
 * Existing code and documentation reference this path, so we keep it as a re-export.
 */

export { createAllTools as createMcpTools } from './tools'
