import { AGENT_JSON_RENDER_CATALOG } from './json-render-catalog-with-schema'
import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'

const AGENT_JSON_RENDER_COMPONENT_RENDERERS = {
  Card: shadcnComponents.Card,
  Stack: shadcnComponents.Stack,
  Grid: shadcnComponents.Grid,
  Separator: shadcnComponents.Separator,
  Heading: shadcnComponents.Heading,
  Text: shadcnComponents.Text,
  Alert: shadcnComponents.Alert,
  Badge: shadcnComponents.Badge,
  Progress: shadcnComponents.Progress,
  Skeleton: shadcnComponents.Skeleton,
  Spinner: shadcnComponents.Spinner,
} as const

export const AGENT_JSON_RENDER_REGISTRY = defineRegistry(
  AGENT_JSON_RENDER_CATALOG,
  {
    components: AGENT_JSON_RENDER_COMPONENT_RENDERERS,
  }
).registry
