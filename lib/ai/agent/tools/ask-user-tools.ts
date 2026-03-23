import { dynamicTool } from 'ai'
import { z } from 'zod/v3'

export function createAskUserTools() {
  return {
    ask_user: dynamicTool({
      description: `Ask the user a question to gather information needed for analysis. Use this tool when you need clarification, user preferences, or structured input before proceeding. Supports multiple input types:
- single_choice: Present options for the user to pick one (e.g., "Which database?", "What time range?")
- multi_choice: Checkboxes for selecting multiple items (e.g., "Which metrics to include?")
- confirm: Yes/no confirmation with context (e.g., "Analyze all 5 slow queries or just the top one?")
- free_text: Open-ended text input (e.g., "Describe the symptoms you're seeing")
- rating: Numeric scale (e.g., "Rate the usefulness of this analysis 1-5")`,
      inputSchema: z.object({
        question: z.string().describe('The question to ask the user'),
        inputType: z
          .enum([
            'single_choice',
            'multi_choice',
            'confirm',
            'free_text',
            'rating',
          ])
          .describe('Type of input widget to show'),
        options: z
          .array(
            z.object({
              label: z.string().describe('Display label'),
              value: z.string().describe('Value to return when selected'),
              description: z
                .string()
                .optional()
                .describe('Optional description/hint'),
            })
          )
          .optional()
          .describe('Options for single_choice and multi_choice types'),
        placeholder: z
          .string()
          .optional()
          .describe('Placeholder text for free_text input'),
        min: z
          .number()
          .optional()
          .describe('Minimum value for rating (default: 1)'),
        max: z
          .number()
          .optional()
          .describe('Maximum value for rating (default: 5)'),
        context: z
          .string()
          .optional()
          .describe('Additional context shown above the question'),
      }),
      execute: async (input: unknown) => {
        const params = input as {
          question: string
          inputType:
            | 'single_choice'
            | 'multi_choice'
            | 'confirm'
            | 'free_text'
            | 'rating'
          options?: Array<{
            label: string
            value: string
            description?: string
          }>
          placeholder?: string
          min?: number
          max?: number
          context?: string
        }

        // Return the structured question — the UI renders this as an interactive widget.
        // The user's response will be provided as the tool result.
        return {
          type: 'ask_user',
          question: params.question,
          inputType: params.inputType,
          options: params.options,
          placeholder: params.placeholder,
          min: params.min ?? 1,
          max: params.max ?? 5,
          context: params.context,
          awaiting_response: true,
        }
      },
    }),
  }
}
