import type { Spec } from '@json-render/core'

import {
  AGENT_JSON_RENDER_MAX_ELEMENT_COUNT,
  AGENT_JSON_RENDER_MAX_SPEC_BYTES,
  AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES,
  AGENT_JSON_RENDER_MAX_SPEC_PARTS,
} from './json-render-limits'
import { applySpecPatch } from '@json-render/core'

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
    return new TextEncoder().encode(JSON.stringify(value)).length
  } catch (_error) {
    return Number.POSITIVE_INFINITY
  }
}

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

    if (!isObject(candidateSpec)) return false
    if (!hasAllowedComponents(candidateSpec)) return false

    if (!('root' in candidateSpec) || !isObject(candidateSpec.elements)) {
      return false
    }

    return true
  } catch (_error) {
    return false
  }
}

export function createJsonRenderPatchGuardStream(
  stream: ReadableStream<unknown>
): ReadableStream<unknown> {
  if (typeof stream.pipeThrough !== 'function') {
    return stream
  }

  let specPartCount = 0
  let specByteBudget = 0
  let compiledSpec: unknown = {}

  const transform = new TransformStream<
    SafeJsonRenderChunk,
    SafeJsonRenderChunk
  >({
    transform: (chunk, controller) => {
      if (!isDataSpecChunk(chunk)) {
        controller.enqueue(chunk)
        return
      }

      const partBytes = safeByteLength(chunk.data)
      if (partBytes > AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES) {
        return
      }

      if (specPartCount + 1 > AGENT_JSON_RENDER_MAX_SPEC_PARTS) {
        return
      }

      const candidateBytes = specByteBudget + partBytes
      if (candidateBytes > AGENT_JSON_RENDER_MAX_SPEC_BYTES) {
        return
      }

      let candidateSpec = compiledSpec
      const specData = chunk.data

      try {
        if (specData.type === 'patch') {
          if (!isObject(specData.patch)) {
            return
          }

          candidateSpec = applySpecPatch(
            compiledSpec as Spec,
            specData.patch as never
          ) as unknown
        } else if (specData.type === 'flat' || specData.type === 'nested') {
          if (!isObject(specData.spec)) {
            return
          }

          candidateSpec = specData.spec
        } else {
          return
        }
      } catch (_error) {
        return
      }

      if (!validateJsonRenderSpecCandidate(candidateSpec)) {
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
