import { defineCatalog } from '@json-render/core'
import { schema as reactSchema } from '@json-render/react'
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog'

import { AGENT_JSON_RENDER_COMPONENT_NAMES } from './json-render-catalog'

const AGENT_JSON_RENDER_COMPONENTS = {
  Card: shadcnComponentDefinitions.Card,
  Stack: shadcnComponentDefinitions.Stack,
  Grid: shadcnComponentDefinitions.Grid,
  Separator: shadcnComponentDefinitions.Separator,
  Heading: shadcnComponentDefinitions.Heading,
  Text: shadcnComponentDefinitions.Text,
  Alert: shadcnComponentDefinitions.Alert,
  Badge: shadcnComponentDefinitions.Badge,
  Progress: shadcnComponentDefinitions.Progress,
  Skeleton: shadcnComponentDefinitions.Skeleton,
  Spinner: shadcnComponentDefinitions.Spinner,
} as const

export const AGENT_JSON_RENDER_CATALOG = defineCatalog(reactSchema, {
  components: AGENT_JSON_RENDER_COMPONENTS,
  actions: {},
})

export type AgentJsonRenderComponentName =
  (typeof AGENT_JSON_RENDER_COMPONENT_NAMES)[number]
