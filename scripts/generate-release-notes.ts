const repo = process.env.GITHUB_REPOSITORY ?? 'duyet/clickhouse-monitoring'
const tag = process.env.RELEASE_TAG ?? process.env.GITHUB_REF_NAME ?? 'v0.0.0'
const sha = process.env.GITHUB_SHA ?? ''
const shortSha = sha.slice(0, 7) || 'unknown'
const date = new Date().toISOString()

// AI-generated summary of changes, produced by the GitHub Models action in CI
// and passed through the AI_SUMMARY env var. Empty when generation is skipped
// (no models access) so the section is omitted.
const aiSummary = (process.env.AI_SUMMARY ?? '').trim()

const summarySection = aiSummary
  ? `## What's changed

${aiSummary}

`
  : ''

const notes = `Built from commit \`${shortSha}\` on ${date}.

${summarySection}`

process.stdout.write(notes)
