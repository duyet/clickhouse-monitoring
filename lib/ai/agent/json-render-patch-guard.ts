import type { Spec } from '@json-render/core'

import {
  AGENT_JSON_RENDER_MAX_ELEMENT_COUNT,
  AGENT_JSON_RENDER_MAX_SPEC_BYTES,
  AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES,
  AGENT_JSON_RENDER_MAX_SPEC_PARTS,
} from './json-render-limits'
import { applySpecPatch } from '@json-render/core'

const jsonRenderPatchTextEncoder = new TextEncoder()

const AGENT_JSON_RENDER_ALLOWED_COMPONENTS = new Set([
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
])
const DANGEROUS_POINTER_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])
const ALLOWED_PATCH_OPS = new Set([
  'add',
  'remove',
  'replace',
  'move',
  'copy',
  'test',
])

function hasAllowedComponents(spec: Record<string, unknown>): boolean {
  const elements = spec.elements
  if (!isObject(elements) || Array.isArray(elements)) return false

  for (const element of Object.values(elements)) {
    if (!isObject(element) || typeof element.type !== 'string') {
      return false
    }

    if (!AGENT_JSON_RENDER_ALLOWED_COMPONENTS.has(element.type)) {
      return false
    }
  }

  return true
}

type SafeJsonRenderChunk = {
  type: string
  [key: string]: unknown
}

type JsonRenderSpecData =
  | { type: 'patch'; patch: unknown }
  | { type: 'flat'; spec: unknown }
  | { type: 'nested'; spec: unknown }

type JsonRenderDataSpecChunk = SafeJsonRenderChunk & {
  type: 'data-spec'
  data: JsonRenderSpecData
}

function safeByteLength(value: unknown): number {
  try {
    return jsonRenderPatchTextEncoder.encode(JSON.stringify(value)).length
  } catch (_error) {
    return Number.POSITIVE_INFINITY
  }
}

const DEBUG_PATCH_GUARD =
  process.env.NODE_ENV !== 'production' &&
  process.env.AGENT_JSON_RENDER_PATCH_GUARD_DEBUG === '1'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function countSpecElements(spec: unknown): number {
  if (!isObject(spec) || !('elements' in spec)) return 0

  const elements = spec.elements
  if (!isObject(elements) || Array.isArray(elements)) return 0

  return Object.keys(elements).length
}

function isJsonRenderSpecData(value: unknown): value is JsonRenderSpecData {
  if (!isObject(value) || typeof value.type !== 'string') return false

  return (
    value.type === 'patch' || value.type === 'flat' || value.type === 'nested'
  )
}

function isDataSpecChunk(value: unknown): value is JsonRenderDataSpecChunk {
  return (
    isObject(value) &&
    value.type === 'data-spec' &&
    isJsonRenderSpecData(value.data)
  )
}

function hasDangerousPointer(path: string): boolean {
  return path
    .split('/')
    .slice(1)
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .some((segment) => DANGEROUS_POINTER_SEGMENTS.has(segment))
}

function hasDangerousPatchPointer(value: unknown): boolean {
  if (!isObject(value) || typeof value.path !== 'string') {
    return true
  }

  if (hasDangerousPointer(value.path)) {
    return true
  }

  if (
    (value.op === 'move' || value.op === 'copy') &&
    typeof value.from === 'string'
  ) {
    if (!value.from.startsWith('/')) {
      return true
    }

    return hasDangerousPointer(value.from)
  }

  return false
}

function isSafeJsonPatch(value: unknown): boolean {
  if (!isObject(value)) {
    return false
  }

  if (typeof value.op !== 'string' || !ALLOWED_PATCH_OPS.has(value.op)) {
    return false
  }

  if (typeof value.path !== 'string') {
    return false
  }

  if (!value.path.startsWith('/')) {
    return false
  }

  if (hasDangerousPatchPointer(value)) {
    return false
  }

  return true
}

function validateJsonRenderSpecCandidate(candidateSpec: unknown): boolean {
  try {
    if (!isObject(candidateSpec)) return false

    if (
      countSpecElements(candidateSpec) > AGENT_JSON_RENDER_MAX_ELEMENT_COUNT
    ) {
      return false
    }

    if (safeByteLength(candidateSpec) > AGENT_JSON_RENDER_MAX_SPEC_BYTES) {
      return false
    }

    if (!hasAllowedComponents(candidateSpec)) return false

    if (!('root' in candidateSpec) || !isObject(candidateSpec.elements)) {
      return false
    }

    return true
  } catch (_error) {
    return false
  }
}

export function createJsonRenderPatchGuardStream<T>(
  stream: ReadableStream<T>
): ReadableStream<T> {
  if (typeof stream.pipeThrough !== 'function') {
    return stream
  }

  let specPartCount = 0
  let specByteBudget = 0
  let compiledSpec: Spec = { root: '', elements: {} }

  const transform = new TransformStream<T, T>({
    transform: (chunk, controller) => {
      if (!isDataSpecChunk(chunk)) {
        controller.enqueue(chunk)
        return
      }

      const specChunk = chunk as JsonRenderDataSpecChunk
      const partBytes = safeByteLength(specChunk.data)
      if (partBytes > AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES) {
        if (DEBUG_PATCH_GUARD) {
          console.debug('[json-render] Dropped spec chunk: part exceeds limit')
        }

        return
      }

      if (specPartCount + 1 > AGENT_JSON_RENDER_MAX_SPEC_PARTS) {
        if (DEBUG_PATCH_GUARD) {
          console.debug('[json-render] Dropped spec chunk: too many chunks')
        }

        return
      }

      const candidateBytes = specByteBudget + partBytes
      if (candidateBytes > AGENT_JSON_RENDER_MAX_SPEC_BYTES) {
        if (DEBUG_PATCH_GUARD) {
          console.debug('[json-render] Dropped spec chunk: total size exceeded')
        }

        return
      }

      let candidateSpec = compiledSpec
      const specData = specChunk.data

      try {
        if (specData.type === 'patch') {
          if (!isSafeJsonPatch(specData.patch)) {
            if (DEBUG_PATCH_GUARD) {
              console.debug('[json-render] Dropped spec chunk: invalid patch')
            }

            return
          }

          candidateSpec = applySpecPatch(
            compiledSpec as Spec,
            specData.patch as never
          ) as Spec
        } else if (specData.type === 'flat' || specData.type === 'nested') {
          if (!isObject(specData.spec)) {
            if (DEBUG_PATCH_GUARD) {
              console.debug(
                '[json-render] Dropped spec chunk: non-object flat/nested spec'
              )
            }

            return
          }

          if (!hasAllowedComponents(specData.spec) || !('root' in specData.spec)) {
            if (DEBUG_PATCH_GUARD) {
              console.debug('[json-render] Dropped spec chunk: blocked component/root')
            }

            return
          }

          candidateSpec = specData.spec as unknown as Spec
        } else {
          if (DEBUG_PATCH_GUARD) {
            console.debug('[json-render] Dropped spec chunk: unknown spec type')
          }

          return
        }
      } catch (_error) {
        if (DEBUG_PATCH_GUARD) {
          console.debug('[json-render] Dropped spec chunk: apply failed', _error)
        }

        return
      }

      if (!validateJsonRenderSpecCandidate(candidateSpec)) {
        if (DEBUG_PATCH_GUARD) {
          console.debug('[json-render] Dropped spec chunk: validation failed')
        }

        return
      }

      specPartCount += 1
      specByteBudget = candidateBytes
      compiledSpec = candidateSpec
      controller.enqueue(chunk)
    },
  })

  return stream.pipeThrough(transform)
}
