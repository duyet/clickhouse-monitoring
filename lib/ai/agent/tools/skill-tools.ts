import { getSkillsMetadata, loadSkillContent } from '../skills/registry'
import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createSkillTools() {
  return {
    load_skill: dynamicTool({
      description: `Load specialized knowledge to provide expert-level guidance on specific topics.\n\nAvailable skills:\n${getSkillsMetadata()
        .map((s) => `- ${s.name}: ${s.description}`)
        .join(
          '\n'
        )}\n\nWhen to use:\n- User asks about best practices, design patterns, or optimization strategies\n- You need expert-level knowledge beyond your built-in instructions\n\nThe skill content will be returned as text that you should follow as expert guidance.`,
      inputSchema: z.object({
        name: z.string().describe('Name of the skill to load'),
      }),
      execute: async (input: unknown) => {
        const { name } = input as { name: string }
        const content = await loadSkillContent(name)
        if (!content) {
          const available = getSkillsMetadata()
            .map((s) => s.name)
            .join(', ')
          throw new Error(
            `Skill "${name}" not found. Available skills: ${available}`
          )
        }
        return content
      },
    }),
  }
}
