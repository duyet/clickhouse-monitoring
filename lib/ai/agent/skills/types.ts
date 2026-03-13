/**
 * Skill metadata and content types for the agent skills system.
 * Skills are loaded at build time and bundled into the registry.
 */

export interface SkillMetadata {
  /** Unique skill identifier */
  name: string
  /** Short description shown to the agent for skill selection */
  description: string
}

export interface Skill extends SkillMetadata {
  /** Full skill content (SKILL.md body without frontmatter) */
  content: string
}
