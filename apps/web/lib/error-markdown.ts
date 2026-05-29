import type { CardError } from './card-error-utils'

export function getErrorMarkdown(error: CardError, title?: string): string {
  const now = new Date().toISOString()

  let markdown = `# ClickHouse Monitoring Error\n\n`
  markdown += `**Timestamp**: ${now}\n\n`

  if (title) {
    markdown += `## Context\n\n`
    markdown += `**Chart**: ${title}\n\n`
  }

  markdown += `## Error\n\n`
  markdown += `**Message**: \n\`\`\`\n${error.message}\n\`\`\`\n\n`

  const apiError = error as { type?: string; details?: unknown }
  if (apiError.type) {
    markdown += `**Type**: ${apiError.type}\n\n`
  }

  const errorDetails = error as { details?: unknown }
  if (errorDetails.details && typeof errorDetails.details === 'object') {
    const details = errorDetails.details as {
      query?: string
      originalError?: Error | unknown
      statusCode?: number
      clickHouseVersion?: string
    }

    if (details.query) {
      markdown += `### Query\n\n`
      markdown += `\`\`\`sql\n${details.query}\n\`\`\`\n\n`
    }

    if (details.originalError) {
      markdown += `### Original Error\n\n`
      if (details.originalError instanceof Error) {
        markdown += `\`\`\`\n${details.originalError.message}\n\`\`\`\n\n`
        if (details.originalError.stack) {
          markdown += `Stack:\n\`\`\`\n${details.originalError.stack}\n\`\`\`\n\n`
        }
      } else {
        markdown += `\`\`\`\n${String(details.originalError)}\n\`\`\`\n\n`
      }
    }

    if (details.statusCode) {
      markdown += `### HTTP Status\n\n`
      markdown += `**Code**: ${details.statusCode}\n\n`
    }

    if (details.clickHouseVersion) {
      markdown += `### System Info\n\n`
      markdown += `**ClickHouse Version**: ${details.clickHouseVersion}\n\n`
    }
  }

  markdown += `## Fix Needed\n\n`
  markdown += `Please analyze this error and provide:\n`
  markdown += `1. Root cause explanation\n`
  markdown += `2. Specific fix steps\n`
  markdown += `3. Preventive measures\n`

  return markdown
}
