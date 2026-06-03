/// <reference types="vite/client" />

// Client-exposed env vars MUST be VITE_-prefixed — Vite inlines import.meta.env
// at build time (the Next app's NEXT_PUBLIC_* equivalent). Add new public vars
// here so they are typed wherever import.meta.env is read.
interface ImportMetaEnv {
  readonly VITE_AUTH_PROVIDER?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  readonly VITE_FEATURE_CONVERSATION_DB?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
