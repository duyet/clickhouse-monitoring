# LangGraph Agents API Reference

This guide is for developers who want to extend or customize the AI agent system.

## Architecture

The agent system is built on [LangGraph](https://langchain-ai.github.io/langgraph/), a framework for building stateful, multi-actor applications with LLMs.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Chat UI   │────▶│ API Routes  │────▶│   Agents    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  LangGraph  │
                                       │   Workflow  │
                                       └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │ Text-to-SQL │           │   Analysis  │           │  Anomaly    │
            │    Node    │           │    Node     │           │ Detection   │
            └─────────────┘           └─────────────┘           └─────────────┘
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │ ClickHouse │           │ ClickHouse │           │ ClickHouse │
            │   Tools    │           │   Tools    │           │   Tools    │
            └─────────────┘           └─────────────┘           └─────────────┘
```

## State Schema

The agent state is defined in `lib/agents/state.ts`:

```typescript
import { Annotation } from '@langchain/langgraph'
import { MessagesAnnotation } from '@langchain/langgraph/messages'

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  // Extended state properties
  hostId: Annotation<number>({
    reducer: (prev, next) => next ?? prev,
    default: () => 0
  }),
  queryResult: Annotation<QueryResult | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null
  }),
  analysis: Annotation<Analysis | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null
  }),
  errors: Annotation<string[]>({
    reducer: (prev, next) => [...(prev || []), ...(next || [])],
    default: () => []
  })
})
```

## Adding a New Agent Node

### Step 1: Define the Node Function

Create a new file in `lib/agents/nodes/`:

```typescript
// lib/agents/nodes/my-agent.ts
import { StateAnnotation } from '../state'
import type { AgentState } from '../state'

interface MyNodeOutput {
  response: string
  data?: unknown
}

export async function myAgentNode(
  state: typeof AgentState.State
): Promise<Partial<AgentState>> {
  // Access state properties
  const { messages, hostId } = state

  // Get the last user message
  const lastMessage = messages[messages.length - 1]
  const userInput = lastMessage.content

  // Implement your logic
  const result = await processData(userInput, hostId)

  // Return state updates
  return {
    messages: [
      {
        role: 'assistant',
        content: result.response,
        data: result.data
      }
    ]
  }
}
```

### Step 2: Register the Node

Add your node to the graph in `lib/agents/graph.ts`:

```typescript
import { myAgentNode } from './nodes/my-agent'

export function createAgentGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode('text-to-sql', textToSqlNode)
    .addNode('my-agent', myAgentNode)  // Add your node
    .addNode('analysis', analysisNode)
    // ... add edges

  return workflow.compile()
}
```

### Step 3: Add Routing Logic (Optional)

If your node needs conditional routing:

```typescript
function shouldRunMyAgent(state: typeof AgentState.State): string {
  const lastMessage = state.messages[state.messages.length - 1]
  const input = lastMessage.content.toLowerCase()

  if (input.includes('analyze')) {
    return 'my-agent'
  }
  return 'text-to-sql'
}

// Add conditional edge
workflow.addConditionalEdges(
  'router',
  shouldRunMyAgent,
  {
    'text-to-sql': 'text-to-sql',
    'my-agent': 'my-agent',
    'analysis': 'analysis'
  }
)
```

## Tool Registration

Tools are functions that agents can call to interact with ClickHouse or perform operations.

### Defining a Tool

Create tools in `lib/agents/tools/`:

```typescript
// lib/agents/tools/clickhouse-tools.ts
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { fetchData } from '@/lib/clickhouse'

export const executeQueryTool = tool(
  async ({ sql, hostId }) => {
    try {
      const result = await fetchData({
        query: sql,
        hostId,
        format: 'JSONEachRow'
      })

      return {
        success: true,
        data: result,
        rows: result.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },
  {
    name: 'execute_clickhouse_query',
    description: 'Execute a read-only SELECT query on ClickHouse',
    schema: z.object({
      sql: z.string().describe('The SQL query to execute'),
      hostId: z.number().describe('The ClickHouse host ID')
    })
  }
)
```

### Tool Progress Monitoring

For long-running tools, you can add progress reporting to provide real-time feedback to users:

```typescript
// lib/agents/tools/clickhouse-tools.ts
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { fetchData } from '@/lib/clickhouse'
import type { ToolContext } from '../registry'

export const executeQueryTool = tool(
  async ({ sql, hostId }, config?: ToolContext) => {
    const { onProgress } = config ?? {}

    // Report starting
    await onProgress?.({ message: 'Validating query...' })

    try {
      // Validate
      validateSqlQuery(sql)

      // Report executing
      await onProgress?.({ message: 'Executing query...', percent: 50 })

      const result = await fetchData({
        query: sql,
        hostId,
        format: 'JSONEachRow'
      })

      // Report completion
      await onProgress?.({ message: 'Complete', percent: 100 })

      return {
        success: true,
        data: result,
        rows: result.length
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  },
  {
    name: 'execute_clickhouse_query',
    description: 'Execute a read-only SELECT query on ClickHouse',
    schema: z.object({
      sql: z.string().describe('The SQL query to execute'),
      hostId: z.number().describe('The ClickHouse host ID')
    })
  }
)
```

**Progress Event Interface:**

```typescript
import type { ToolProgressEvent, ToolContext } from '@/lib/agents/tools/registry'

// ToolContext is passed as the second parameter to tool functions
// ToolProgressEvent has the following fields:
interface ToolProgressEvent {
  percent?: number      // Progress percentage (0-100)
  message: string       // Current status message
  step?: number         // Current step in multi-step operations
  totalSteps?: number   // Total steps in multi-step operations
}
```

**Example usage patterns:**

```typescript
// Simple progress
await onProgress?.({ message: 'Starting operation...' })

// Progress with percentage
await onProgress?.({ message: 'Processing...', percent: 50 })

// Multi-step progress
await onProgress?.({ message: 'Step 1 of 3', step: 1, totalSteps: 3 })
```

### Registering Tools

```typescript
// lib/agents/tools/index.ts
import { executeQueryTool, getTableSchemaTool } from './clickhouse-tools'
import { getMetricsTool } from './metrics-tools'

export const agentTools = [
  executeQueryTool,
  getTableSchemaTool,
  getMetricsTool
]
```

## Agent Prompts

Prompts are defined in `lib/agents/prompts/`:

```typescript
// lib/agents/prompts/text-to-sql.ts
export const TEXT_TO_SQL_PROMPT = `You are a ClickHouse SQL expert.

Available tables:
{table_schema}

User question: {question}

Generate a ClickHouse SELECT query that answers the question.
Only use the tables listed above.
Return only the SQL query without markdown formatting.`

export function formatTextToSqlPrompt(
  question: string,
  tableSchema: string
): string {
  return TEXT_TO_SQL_PROMPT
    .replace('{question}', question)
    .replace('{table_schema}', tableSchema)
}
```

## API Routes

Agent endpoints are in `app/api/v1/agents/`:

```typescript
// app/api/v1/agents/chat/route.ts
import { createAgentGraph } from '@/lib/agents/graph'
import { streamRunnable } from '@langchain/langgraph/runtime'

export async function POST(req: Request) {
  const { message, hostId } = await req.json()

  const graph = createAgentGraph()
  const stream = await streamRunnable(
    graph,
    {
      messages: [{ role: 'user', content: message }],
      hostId
    }
  )

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`)
        }
        controller.close()
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    }
  )
}
```

## Client-Side Integration

```typescript
// components/ai/chat-interface.tsx
'use client'

import { useChat } from '@/lib/hooks/use-ai-chat'

export function ChatInterface({ hostId }: { hostId: number }) {
  const { messages, sendMessage, isLoading } = useChat(hostId)

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input
        type="text"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value)
            e.currentTarget.value = ''
          }
        }}
        disabled={isLoading}
      />
    </div>
  )
}
```

## Workflow Patterns

### Sequential Execution

```typescript
workflow
  .addNode('step1', step1Node)
  .addNode('step2', step2Node)
  .addNode('step3', step3Node)
  .addEdge('step1', 'step2')
  .addEdge('step2', 'step3')
  .addEdge('step3', END)
```

### Conditional Routing

```typescript
workflow.addConditionalEdges(
  'decider',
  decideNextStep,
  {
    path_a: 'nodeA',
    path_b: 'nodeB',
    default: 'nodeDefault'
  }
)
```

### Parallel Execution

```typescript
workflow
  .addNode('split', splitNode)
  .addNode('task1', task1Node)
  .addNode('task2', task2Node)
  .addNode('join', joinNode)
  .addEdge('split', 'task1')
  .addEdge('split', 'task2')
  .addEdge('task1', 'join')
  .addEdge('task2', 'join')
```

## Testing

```typescript
// lib/agents/__tests__/my-agent.test.ts
import { describe, it, expect } from 'bun:test'
import { myAgentNode } from '../nodes/my-agent'
import { AgentState } from '../state'

describe('myAgentNode', () => {
  it('should process input and return response', async () => {
    const inputState = {
      messages: [{ role: 'user', content: 'test input' }],
      hostId: 0
    }

    const result = await myAgentNode(inputState)

    expect(result.messages).toHaveLength(1)
    expect(result.messages[0].role).toBe('assistant')
  })
})
```

## Error Handling

```typescript
export async function safeAgentNode(
  state: typeof AgentState.State
): Promise<Partial<AgentState>> {
  try {
    const result = await riskyOperation(state)
    return { messages: [{ role: 'assistant', content: result }] }
  } catch (error) {
    return {
      errors: [
        `Node failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ],
      messages: [
        {
          role: 'assistant',
          content: 'I encountered an error. Please try rephrasing your request.'
        }
      ]
    }
  }
}
```

## Configuration

Environment variables for agent behavior:

```bash
# LLM Configuration
LLM_API_KEY=sk-ant-...
LLM_API_BASE=https://openrouter.ai/api/v1
LLM_MODEL=openrouter/free
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7

# Agent Configuration
AGENT_MAX_STEPS=10
AGENT_TIMEOUT=60000
AGENT_STREAM_ENABLED=true
```

## Best Practices

1. **State Immutability**: Always return new state, never mutate input state
2. **Error Recovery**: Include fallback paths in conditional routing
3. **Timeout Handling**: Set appropriate timeouts for LLM calls
4. **Input Validation**: Validate user input before processing
5. **Tool Safety**: Sanitize all SQL queries before execution
6. **Streaming**: Use streaming responses for long-running operations
7. **Testing**: Mock LLM calls in tests for reliability and speed

## Type Safety

All agent nodes should be fully typed:

```typescript
import type { RunnableConfig } from '@langchain/core/runnables'

export async function typedNode(
  state: typeof AgentState.State,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // Fully typed implementation
}
```

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain Core](https://js.langchain.com/)
- [ClickHouse SQL Reference](https://clickhouse.com/docs/en/sql-reference/)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/)
