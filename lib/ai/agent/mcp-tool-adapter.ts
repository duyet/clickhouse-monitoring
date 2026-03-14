/**
 * MCP-to-AI-SDK Tool Adapter
 *
 * Delegates to modular tool category files in ./tools/
 * Each category file exports a factory function returning tools for that domain.
 */

import { createAllTools } from './tools'

/**
 * Create AI SDK tools from modular tool definitions.
 * Signature unchanged for backward compatibility.
 */
export function createMcpTools(hostId: number) {
  return createAllTools(hostId)
}
