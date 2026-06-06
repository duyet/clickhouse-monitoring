// biome-ignore lint/suspicious/noTsIgnore: OpenNext generates this file during cf:build.
// @ts-ignore .open-next/worker.js may not exist before cf:build.
import handler from './.open-next/worker.js'

export default handler satisfies ExportedHandler<CloudflareEnv>

// Re-export OpenNext cache Durable Object classes from the generated worker.
// biome-ignore lint/suspicious/noTsIgnore: OpenNext generates this file during cf:build.
// @ts-ignore .open-next/worker.js may not exist before cf:build.
export { DOQueueHandler } from './.open-next/worker.js'
export { AgentConversationDurableObject } from './lib/conversation-store/agent-conversation-durable-object'
