import { createJsonRenderPatchGuardStream } from '../json-render-patch-guard'
import { describe, expect, test } from 'bun:test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all chunks emitted from a ReadableStream<T> into an array. */
async function collect<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader()
  const chunks: T[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return chunks
}

/** Build a ReadableStream from a fixed list of chunks. */
function makeStream<T>(chunks: T[]): ReadableStream<T> {
  return new ReadableStream<T>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk)
      controller.close()
    },
  })
}

/** Minimal valid allowed component element. */
const validElement = (type = 'Card') => ({ type })

/** A minimal valid spec object that passes validateJsonRenderSpecCandidate. */
const validSpec = () => ({
  root: 'el1',
  elements: { el1: validElement('Card') },
})

/** Build a data-spec chunk with a patch payload. */
function patchChunk(patch: unknown) {
  return { type: 'data-spec', data: { type: 'patch', patch } } as const
}

/** Build a data-spec chunk with a flat payload. */
function flatChunk(spec: unknown) {
  return { type: 'data-spec', data: { type: 'flat', spec } } as const
}

/** Build a data-spec chunk with a nested payload. */
function nestedChunk(spec: unknown) {
  return { type: 'data-spec', data: { type: 'nested', spec } } as const
}

// ---------------------------------------------------------------------------
// Pass-through: non-data-spec chunks
// ---------------------------------------------------------------------------

describe('non-data-spec chunks', () => {
  test('passes through chunks whose type is not data-spec', async () => {
    const input = [
      { type: 'text', content: 'hello' },
      { type: 'some-other', foo: 42 },
    ]
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream(input))
    )
    expect(out).toEqual(input)
  })

  test('passes through a chunk whose data.type is an unrecognised string', async () => {
    // isDataSpecChunk returns false when data.type is not patch/flat/nested,
    // so the chunk is treated as a non-data-spec chunk and passed straight through.
    const unknown = { type: 'data-spec', data: { type: 'unknown-type' } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([unknown]))
    )
    expect(out).toEqual([unknown])
  })

  test('passes through empty stream', async () => {
    const out = await collect(createJsonRenderPatchGuardStream(makeStream([])))
    expect(out).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// stream without pipeThrough (no-op path)
// ---------------------------------------------------------------------------

describe('stream without pipeThrough', () => {
  test('returns original stream when pipeThrough is missing', () => {
    const fakeStream = {
      pipeThrough: undefined,
    } as unknown as ReadableStream<unknown>
    const result = createJsonRenderPatchGuardStream(fakeStream)
    expect(result).toBe(fakeStream)
  })
})

// ---------------------------------------------------------------------------
// flat / nested spec chunks
// ---------------------------------------------------------------------------

describe('flat spec chunks', () => {
  test('allows a valid flat spec with an allowed component', async () => {
    const chunk = flatChunk(validSpec())
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([chunk]))
    )
    expect(out).toHaveLength(1)
    expect(out[0]).toBe(chunk)
  })

  test('drops a flat spec that uses a disallowed component', async () => {
    const spec = { root: 'x', elements: { x: { type: 'DangerousIframe' } } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
    )
    expect(out).toEqual([])
  })

  test('drops a flat spec missing root', async () => {
    const spec = { elements: { el1: { type: 'Card' } } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
    )
    expect(out).toEqual([])
  })

  test('drops a flat spec that is not an object', async () => {
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk('string')]))
    )
    expect(out).toEqual([])
  })

  test('drops a flat spec with null elements', async () => {
    const spec = { root: 'el1', elements: null }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
    )
    expect(out).toEqual([])
  })

  test('drops a flat spec with array elements', async () => {
    const spec = { root: 'el1', elements: [{ type: 'Card' }] }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
    )
    expect(out).toEqual([])
  })

  test('drops a flat spec when one element has a non-string type', async () => {
    const spec = { root: 'el1', elements: { el1: { type: 123 } } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
    )
    expect(out).toEqual([])
  })
})

describe('nested spec chunks', () => {
  test('allows a valid nested spec', async () => {
    const chunk = nestedChunk(validSpec())
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([chunk]))
    )
    expect(out).toHaveLength(1)
  })

  test('drops a nested spec that is not an object', async () => {
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([nestedChunk(null)]))
    )
    expect(out).toEqual([])
  })

  test('drops a nested spec with a disallowed component', async () => {
    const spec = { root: 'x', elements: { x: { type: 'Script' } } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([nestedChunk(spec)]))
    )
    expect(out).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// patch spec chunks — op validation
// ---------------------------------------------------------------------------

describe('patch spec — op field', () => {
  test('drops patch with an unknown op', async () => {
    const patch = { op: 'hack', path: '/elements/x' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch with missing op', async () => {
    const patch = { path: '/elements/x' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch where op is not a string', async () => {
    const patch = { op: 42, path: '/elements/x' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch that is not an object', async () => {
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk('oops')]))
    )
    expect(out).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// patch spec chunks — path validation
// ---------------------------------------------------------------------------

describe('patch spec — path field', () => {
  test('drops patch with missing path', async () => {
    const patch = { op: 'add' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch whose path does not start with /', async () => {
    const patch = { op: 'add', path: 'elements/x', value: { type: 'Card' } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch targeting __proto__', async () => {
    const patch = { op: 'add', path: '/__proto__/x', value: 'evil' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch targeting prototype', async () => {
    const patch = { op: 'add', path: '/prototype/x', value: 'evil' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch targeting constructor', async () => {
    const patch = { op: 'add', path: '/constructor/x', value: 'evil' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops patch with JSON-Pointer encoded dangerous segment (~1 for /)', async () => {
    // ~0 decodes to ~, ~1 decodes to /. A segment literally named __proto__ should still be blocked.
    const patch = { op: 'add', path: '/__proto__', value: 'evil' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// patch spec chunks — move/copy from field
// ---------------------------------------------------------------------------

describe('patch spec — move/copy from field', () => {
  test('drops move patch with from not starting with /', async () => {
    // The patch references a valid path but a relative `from` — must be rejected.
    const patch = { op: 'move', path: '/elements/dest', from: 'elements/src' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops copy patch with dangerous from path', async () => {
    const patch = { op: 'copy', path: '/elements/dest', from: '/__proto__/x' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })

  test('drops move patch whose from targets constructor', async () => {
    const patch = { op: 'move', path: '/elements/dest', from: '/constructor/x' }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([patchChunk(patch)]))
    )
    expect(out).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Limits enforcement
// ---------------------------------------------------------------------------

describe('part count limit', () => {
  test('drops chunks beyond AGENT_JSON_RENDER_MAX_SPEC_PARTS (80)', async () => {
    // Build 81 valid flat chunks. First 80 should pass, 81st should be dropped.
    const chunks = Array.from({ length: 81 }, (_, i) =>
      flatChunk({
        root: 'el',
        elements: { el: validElement(i % 2 === 0 ? 'Card' : 'Text') },
      })
    )
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream(chunks))
    )
    expect(out).toHaveLength(80)
  })
})

describe('part byte limit', () => {
  test('drops a single chunk that exceeds AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES (24 KiB)', async () => {
    // Create a spec with a very large value to exceed 24 KiB
    const bigString = 'x'.repeat(25 * 1024)
    const spec = {
      root: 'el',
      elements: { el: { type: 'Card', _pad: bigString } },
    }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
    )
    expect(out).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Allowed component names
// ---------------------------------------------------------------------------

describe('allowed component names', () => {
  const ALLOWED = [
    'Card',
    'Stack',
    'Grid',
    'Separator',
    'Heading',
    'Text',
    'Alert',
    'Badge',
    'Progress',
    'Skeleton',
    'Spinner',
  ]

  for (const name of ALLOWED) {
    test(`allows component type "${name}"`, async () => {
      const spec = { root: 'el', elements: { el: { type: name } } }
      const out = await collect(
        createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
      )
      expect(out).toHaveLength(1)
    })
  }

  test('drops a spec with an unlisted component type', async () => {
    const spec = { root: 'el', elements: { el: { type: 'CustomDanger' } } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([flatChunk(spec)]))
    )
    expect(out).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// isDataSpecChunk — data field shape validation
// ---------------------------------------------------------------------------
// When a chunk has type 'data-spec' but the data field is not a valid
// JsonRenderSpecData (patch/flat/nested), isDataSpecChunk returns false and
// the chunk is treated as opaque — it passes through unchanged.
// ---------------------------------------------------------------------------

describe('isDataSpecChunk guard — invalid data shapes pass through untouched', () => {
  test('passes through chunk where data is null', async () => {
    const chunk = { type: 'data-spec', data: null }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([chunk]))
    )
    expect(out).toEqual([chunk])
  })

  test('passes through chunk where data.type is missing', async () => {
    const chunk = { type: 'data-spec', data: { spec: validSpec() } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([chunk]))
    )
    expect(out).toEqual([chunk])
  })

  test('passes through chunk where data.type is a number', async () => {
    // data.type=42 is not a string matching patch/flat/nested, so isDataSpecChunk
    // returns false and the chunk is forwarded as-is.
    const chunk = { type: 'data-spec', data: { type: 42, spec: validSpec() } }
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream([chunk]))
    )
    expect(out).toEqual([chunk])
  })
})

// ---------------------------------------------------------------------------
// Sequential stream state — compiledSpec accumulation
// ---------------------------------------------------------------------------

describe('stream state accumulation', () => {
  test('accepts multiple valid flat chunks in sequence', async () => {
    const chunks = [
      flatChunk(validSpec()),
      flatChunk({ root: 'a', elements: { a: { type: 'Text' } } }),
    ]
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream(chunks))
    )
    expect(out).toHaveLength(2)
  })

  test('non-data-spec chunks do not affect the spec byte budget', async () => {
    // Send 79 valid flat specs (under limit), one non-data-spec, then one more flat spec.
    // All 80 flat specs should pass.
    const flatChunks = Array.from({ length: 79 }, () => flatChunk(validSpec()))
    const textChunk = { type: 'text', content: 'hello' }
    const lastFlat = flatChunk({
      root: 'b',
      elements: { b: { type: 'Badge' } },
    })
    const chunks = [...flatChunks, textChunk, lastFlat]
    const out = await collect(
      createJsonRenderPatchGuardStream(makeStream(chunks))
    )
    // 79 flat + 1 text + 1 flat = 81 out, all passing (80 flat within limit + 1 text)
    expect(out).toHaveLength(81)
  })
})
