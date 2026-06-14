export const AGENT_JSON_RENDER_MAX_SPEC_PARTS = 80
export const AGENT_JSON_RENDER_MAX_SPEC_PART_BYTES = 24 * 1024
export const AGENT_JSON_RENDER_MAX_SPEC_BYTES = 160 * 1024
export const AGENT_JSON_RENDER_MAX_ELEMENT_COUNT = 200

// Per-patch limits are hard caps for individual payload chunks.
// The total patch budget (`AGENT_JSON_RENDER_MAX_SPEC_BYTES`) is enforced across
// accepted chunks and is the ultimate guard for cumulative stream size.
