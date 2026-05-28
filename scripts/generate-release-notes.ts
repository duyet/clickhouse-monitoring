import { execFileSync } from 'node:child_process'

const repo = process.env.GITHUB_REPOSITORY ?? 'duyet/clickhouse-monitoring'
const tag = process.env.RELEASE_TAG ?? process.env.GITHUB_REF_NAME ?? 'v0.0.0'
const version = tag.replace(/^v/, '')
const sha = process.env.GITHUB_SHA ?? ''
const shortSha = sha.slice(0, 7) || 'unknown'
const image = `ghcr.io/${repo}`
const date = new Date().toISOString()
const isPrerelease = version.includes('-')
const major = version.split('.')[0]
const minor = version.split('.').slice(0, 2).join('.')
const stableTagNotes = isPrerelease
  ? '- Prerelease tags do not update the major or major.minor Docker aliases.'
  : `- Stable aliases: \`${image}:${minor}\`, \`${image}:${major}\`, and \`${image}:latest\`.`

// AI-generated summary of changes, produced by the GitHub Models action in CI
// and passed through the AI_SUMMARY env var. Empty when generation is skipped
// (no models access) so the section is omitted and Git changes remains.
const aiSummary = (process.env.AI_SUMMARY ?? '').trim()

function runGit(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

const previousTag =
  process.env.PREVIOUS_TAG ||
  runGit(['describe', '--tags', '--abbrev=0', `${tag}^`]) ||
  runGit(['describe', '--tags', '--abbrev=0', 'HEAD^'])
const changeRange = previousTag ? `${previousTag}..HEAD` : 'HEAD'
const gitChanges =
  runGit(['log', '--pretty=format:- %s (%h)', changeRange]) ||
  '- No git changes were detected by the release note generator.'
const compareUrl = previousTag
  ? `https://github.com/${repo}/compare/${previousTag}...${tag}`
  : `https://github.com/${repo}/commits/${tag}`

const summarySection = aiSummary
  ? `## What's changed

${aiSummary}

`
  : ''

const notes = `Built from commit \`${shortSha}\` on ${date}.

${summarySection}## Published Docker tags

- \`${image}:${version}\`
${stableTagNotes}
- Commit tag: \`${image}:sha-${shortSha}\`

## Git changes

${gitChanges}

Complete diff: ${compareUrl}
`

process.stdout.write(notes)
