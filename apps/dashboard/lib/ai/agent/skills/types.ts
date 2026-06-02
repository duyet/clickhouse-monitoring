/**
 * Skill metadata and content types for the agent skills system.
 * Skills are loaded at build time and bundled into the registry.
 * Dynamic skills can also be loaded at runtime or registered via API.
 */

/** Where a skill originates from */
export type SkillSource = 'builtin' | 'user' | 'remote'

export interface SkillMetadata {
  /** Unique skill identifier */
  name: string
  /** Short description shown to the agent for skill selection */
  description: string
  /** Origin of the skill — builtin (bundled), user (filesystem), or remote (API-registered) */
  source?: SkillSource
}

export interface Skill extends SkillMetadata {
  /** Full skill content (SKILL.md body without frontmatter) */
  content: string
}
