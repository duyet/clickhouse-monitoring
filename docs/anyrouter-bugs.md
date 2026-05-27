# AnyRouter — two bugs blocking tool-calling agents

Reproduced 2026-05-27 against `https://anyrouter.dev/api/v1` with my own
API key. Both bugs cause tool-using agent loops to fail at step 2, with
identical user-facing symptom: "the model stops responding after the
first tool call." Diagnosed by comparing AnyRouter's response to what
an OpenAI-compatible client/agent runtime expects.

---

## Bug 1 — `@preset/chmonitor` (and any preset resolving to `z-ai/glm-4.7-flash`) never produces structured tool_calls

### What I see

The preset currently resolves to `z-ai/glm-4.7-flash` via the `deepinfra`
backend. Given a tool definition and a prompt that explicitly asks it to
call the tool, the model returns:

- `choices[0].message.tool_calls: []` (empty)
- `choices[0].message.content: ""`
- `choices[0].message.reasoning_content: "..."` — full chain-of-thought
  text *describing* the tool call ("I need to look for a tool named
  `list_databases` in my available tools…") instead of producing one
- `finish_reason: "length"` because the reasoning consumed the budget

So clients see no tool calls, no final answer, and a `finish_reason`
that's not even `stop` or `tool_calls`. Any agent loop terminates after
step 1 with nothing useful.

### Minimal repro (direct, bypasses my stack entirely)

```bash
curl -sS -X POST https://anyrouter.dev/api/v1/chat/completions \
  -H "Authorization: Bearer $ANYROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@preset/chmonitor",
    "messages": [
      {"role":"user","content":"Call the list_databases tool and tell me how many you see."}
    ],
    "tools": [{
      "type":"function",
      "function":{
        "name":"list_databases",
        "description":"List ClickHouse databases on the connected host",
        "parameters":{"type":"object","properties":{},"required":[]}
      }
    }],
    "tool_choice": "auto",
    "max_tokens": 300
  }'
```

### Observed response (trimmed)

```json
{
  "model": "z-ai/glm-4.7-flash",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "",
      "reasoning_content": "The user wants to know how many databases I see using the `list_databases` tool. 1. Analyze the Request: ...",
      "tool_calls": []
    },
    "finish_reason": "length"
  }],
  "provider": "deepinfra",
  "anyrouter_metadata": {
    "requestId": "req_dc3ad1c5ccad43e09cdccdf6",
    "model": "z-ai/glm-4.7-flash",
    "upstream": { "provider": "deepinfra", "backend": "deepinfra", "latencyMs": 30986 }
  }
}
```

Sample failing requestIds from my tests:
- `req_dc3ad1c5ccad43e09cdccdf6` (direct, with tools)
- `req_8787a2e30c4e4c0d9d52476b` (direct, no tools — also went to glm-4.7-flash)

### What should happen

Either:

1. **Preset routing fix (preferred):** `@preset/chmonitor` should route
   to a model that actually emits OpenAI-format `tool_calls` when given
   a `tools` array — e.g. `google/gemma-4-26b-a4b-it` or
   `qwen/qwen3.5-397b-a17b`, both of which I verified work cleanly via
   AnyRouter today. Right now the preset is effectively broken for any
   tool-using workload.
2. **Model fix (less likely fixable on your side):** the
   `z-ai/glm-4.7-flash` provider needs to be configured to emit
   structured tool_calls, not free-form `reasoning_content`. If
   deepinfra's chat-completions endpoint doesn't support tool emission
   for this model, the model should not be advertised as tool-capable
   in your routing.

### Why this is an AnyRouter-side problem, not a client problem

- The tools array uses the standard OpenAI schema.
- Other AnyRouter-served models (`google/gemma-4-26b-a4b-it`,
  `qwen/qwen3.5-397b-a17b`) get the same request and emit proper
  structured tool_calls in the same response shape.
- The model that's failing is selected by AnyRouter's preset router,
  not the client.

---

## Bug 2 — `google/gemini-3.1-flash-lite` via the `cloudflare` backend strips Gemini's `thought_signature`, breaking every follow-up tool turn

### What I see

Step 1 works: model returns a normal-looking OpenAI `tool_calls` block.

When the client sends the conventional follow-up — the same
conversation plus an assistant message with the original tool_call and
a `role: "tool"` message carrying the result — AnyRouter returns 400
from Cloudflare:

> Upstream provider "cloudflare" returned 400 Bad Request. Model
> execution failed (User Input Error): Unable to submit request because
> function call `list_databases` in the 2. content block is missing a
> `thought_signature`. Learn more:
> <https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thought-signatures>

This is unrecoverable from the client — Gemini requires an opaque
`thought_signature` field to be round-tripped from the model's first
response back into the message history. The signature *exists* on
Gemini's side (Vertex returns it on the function_call part) but
**AnyRouter's OpenAI-compatibility shim is not surfacing it** in the
step-1 response, so the client has nothing to round-trip.

### Minimal repro (step 1)

```bash
curl -sS -X POST https://anyrouter.dev/api/v1/chat/completions \
  -H "Authorization: Bearer $ANYROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "google/gemini-3.1-flash-lite",
    "messages":[{"role":"user","content":"Use the list_databases tool."}],
    "tools":[{"type":"function","function":{"name":"list_databases","description":"List databases","parameters":{"type":"object","properties":{},"required":[]}}}]
  }'
```

### Step-1 response — note the missing thought_signature

```json
{
  "model": "google/gemini-3.1-flash-lite",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "index": 0,
        "id": "call_7ed0a01a82594254bcb40f44",
        "type": "function",
        "function": { "name": "list_databases", "arguments": "{}" }
      }]
    },
    "finish_reason": "tool_calls"
  }],
  "provider": "cloudflare",
  "anyrouter_metadata": {
    "requestId": "req_df10061ed0934cbbb94beeac",
    "upstream": { "provider": "cloudflare", "backend": "cloudflare", "latencyMs": 6868 }
  }
}
```

There is **no** `thought_signature` field anywhere in the message,
tool_call, message metadata, or `anyrouter_metadata`. There is no way
for the client to round-trip it because we never received it.

### Step 2 (the failure)

```bash
curl -sS -X POST https://anyrouter.dev/api/v1/chat/completions \
  -H "Authorization: Bearer $ANYROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model":"google/gemini-3.1-flash-lite",
    "messages":[
      {"role":"user","content":"Use the list_databases tool."},
      {"role":"assistant","tool_calls":[{"id":"call_7ed0a01a82594254bcb40f44","type":"function","function":{"name":"list_databases","arguments":"{}"}}]},
      {"role":"tool","tool_call_id":"call_7ed0a01a82594254bcb40f44","content":"[\"default\",\"system\",\"sentry\"]"}
    ],
    "tools":[{"type":"function","function":{"name":"list_databases","description":"List databases","parameters":{"type":"object","properties":{},"required":[]}}}]
  }'
```

### Step-2 response

```json
{
  "error": {
    "code": "bad_request",
    "message": "Upstream provider \"cloudflare\" returned 400 Bad Request. ... Model execution failed (User Input Error): Unable to submit request because function call `list_databases` in the 2. content block is missing a `thought_signature`. Learn more: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/thought-signatures",
    "metadata": {
      "upstream_backend": "cloudflare",
      "upstream_status": 400
    }
  },
  "anyrouter_metadata": {
    "requestId": "req_dde198eb75d54643a2ae4b1c",
    "upstream": { "provider": "cloudflare", "backend": "cloudflare", "latencyMs": 1357 },
    "attempts": [
      { "backend": "cloudflare", "status": 400, "isFinal": true, "errorCode": "upstream_4xx" }
    ]
  }
}
```

Sample requestIds:
- step 1: `req_df10061ed0934cbbb94beeac`
- step 2 (the 400): `req_dde198eb75d54643a2ae4b1c`
- another full repro end-to-end through our stack: `req_dde198eb75d54643a2ae4b1c`

### What should happen

When AnyRouter receives a tool_call from a Gemini-family upstream:

1. **Capture the upstream's `thought_signature`** (Vertex returns it
   alongside the function_call part).
2. **Surface it to the client.** The cleanest mapping that stays
   OpenAI-compatible is to attach it as an extension field on the
   tool_call object, e.g.:

   ```json
   "tool_calls":[{
     "id":"call_…",
     "type":"function",
     "function":{ "name":"list_databases", "arguments":"{}" },
     "anyrouter_thought_signature":"<opaque>"
   }]
   ```

3. **Round-trip it on the next request.** When a request comes back
   with an assistant message containing the same tool_call id, look up
   the cached signature (or read it from a client-supplied field) and
   re-attach it to the Vertex `function_call` part you send upstream.

The two practical implementations are: (a) AnyRouter stores
`{requestId → signature}` keyed by tool_call_id for ~10 minutes and
re-attaches transparently, or (b) AnyRouter exposes the signature as an
extension field and asks clients to pass it back. Either eliminates the
400.

### Why this is an AnyRouter-side problem, not a client problem

- The Gemini `thought_signature` is **only available** in Gemini's
  native response format. Clients calling AnyRouter speak
  OpenAI-compatible JSON — they cannot retrieve a field your shim
  didn't surface.
- The 400 explicitly identifies the Vertex / Cloudflare AI Workers
  pipeline as the requirement source ("docs.cloud.google.com").
- Anthropic and OpenAI native APIs do not have this concept, so a
  client SDK like Vercel AI SDK has no portable place to put or read
  the signature without provider-specific glue. The OpenAI-compat
  abstraction has to handle it.

---

## Models I verified DO work on AnyRouter (control group)

Same `/chat/completions` endpoint, same tool definition, same key.
Both completed a full 2-step tool loop and returned a coherent final
answer:

| Model | Step 1 | Step 2 | Notes |
|---|---|---|---|
| `anyrouter:google/gemma-4-26b-a4b-it` | tool_calls populated | normal completion | $0 surfaced cost |
| `anyrouter:qwen/qwen3.5-397b-a17b` | tool_calls populated | normal completion | ~$0.012 / call |

So the contract clearly works end-to-end through AnyRouter when the
underlying model is well-behaved and (in Gemini's case) routed through
a backend that doesn't require signature round-tripping. The two bugs
above are specific to the broken combinations.

## Environment

- API base: `https://anyrouter.dev/api/v1`
- Client: direct `curl` (verified) and Vercel AI SDK ToolLoopAgent
  through Next.js 15 (also verified, same symptoms)
- Date of repro: 2026-05-27 UTC
- Key: same `sk-ar-v1-…` used in production for the ClickHouse
  Monitoring deploy at chmonitor.dev (happy to share specific
  requestIds privately if you need account scope to look them up)
