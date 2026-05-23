/**
 * Suggested prompt entries shown on the AI Agent welcome screen and the
 * right-hand sidebar's "Suggested prompts" section.
 *
 * `category` is shown as a short tag (e.g. INSIGHTS, SCHEMA, STORAGE) so the
 * user can scan by intent. `prompt` is the full text injected into the
 * composer when the user clicks the entry.
 */

export interface SuggestedPrompt {
  category: string
  title: string
  prompt: string
}

export const SUGGESTED_PROMPTS: readonly SuggestedPrompt[] = [
  {
    category: 'INSIGHTS',
    title: 'Largest scan ever',
    prompt: "What's the largest data scan ever performed on this cluster?",
  },
  {
    category: 'SCHEMA',
    title: 'Database overview',
    prompt:
      'What databases are available and which ones have the most tables?',
  },
  {
    category: 'STORAGE',
    title: 'Top 10 by disk',
    prompt: 'Show me the 10 largest tables and their disk usage',
  },
  {
    category: 'QUERIES',
    title: 'What is running',
    prompt:
      'Which queries are running right now and how long have they been executing?',
  },
  {
    category: 'QUERIES',
    title: 'Slowest in 24h',
    prompt: 'What are the slowest queries from the past 24 hours?',
  },
  {
    category: 'ERRORS',
    title: 'Recent failures',
    prompt: 'Show me failed queries from the last hour',
  },
  {
    category: 'MERGES',
    title: 'Merge queue check',
    prompt:
      'How is the merge queue performing? Are there any large merges stuck?',
  },
  {
    category: 'SYSTEM',
    title: 'Server resources',
    prompt: 'What is the current CPU, memory, and disk usage of this server?',
  },
] as const
