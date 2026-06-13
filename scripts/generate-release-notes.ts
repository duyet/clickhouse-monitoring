// Renders the GitHub Release body from CI-provided env vars. Kept dependency-free
// and deterministic so it is testable and identical across every duyet repo that
// shares the standardized release pipeline.
//
// Inputs (all optional — empty sections are omitted):
//   AI_SUMMARY        markdown summary from the LLM tier (Copilot → GitHub Models → AnyRouter)
//   AI_PROVIDER       which tier produced the summary (copilot | github-models | anyrouter)
//   RELEASE_TAG       e.g. v0.3.0
//   PREVIOUS_TAG      e.g. v0.2.7 (for the compare link)
//   GITHUB_REPOSITORY owner/repo
//   GITHUB_SERVER_URL https://github.com
//   GITHUB_SHA        build commit
//   DOCKER_IMAGE      e.g. ghcr.io/duyet/clickhouse-monitoring (enables the Docker section)
//   DOCKER_VERSION    image tag, e.g. 0.3.0
//   DOCKER_EXTRA_IMAGE optional second image name, e.g. ghcr.io/duyet/chmonitor

const env = (k: string) => (process.env[k] ?? '').trim()

const sha = env('GITHUB_SHA')
const shortSha = sha.slice(0, 7) || 'unknown'
const date = new Date().toISOString()
const releaseTag = env('RELEASE_TAG')
const previousTag = env('PREVIOUS_TAG')
const repo = env('GITHUB_REPOSITORY')
const server = env('GITHUB_SERVER_URL') || 'https://github.com'
const aiSummary = env('AI_SUMMARY')
const aiProvider = env('AI_PROVIDER')
const recap = env('RECAP_MD')
const dockerImage = env('DOCKER_IMAGE')
const dockerVersion = env('DOCKER_VERSION') || releaseTag.replace(/^v/, '')
const dockerExtraImage = env('DOCKER_EXTRA_IMAGE')

const sections: string[] = []

if (aiSummary) sections.push(aiSummary)

if (recap) sections.push(recap)

if (dockerImage && dockerVersion) {
  const lines = [
    '## 🐳 Docker image',
    '',
    `This release is published to the GitHub Container Registry as \`${dockerImage}:${dockerVersion}\`.`,
    '',
    '```bash',
    `docker pull ${dockerImage}:${dockerVersion}`,
  ]
  if (dockerExtraImage) lines.push(`docker pull ${dockerExtraImage}:${dockerVersion}`)
  lines.push('```', '', 'Pin it in your own `Dockerfile`:', '', '```dockerfile', `FROM ${dockerImage}:${dockerVersion}`, '```')
  sections.push(lines.join('\n'))
}

if (previousTag && releaseTag && repo) {
  sections.push(
    `## 🔁 Full changelog\n\n**Compare:** [\`${previousTag}...${releaseTag}\`](${server}/${repo}/compare/${previousTag}...${releaseTag})`,
  )
}

const providerNote = aiProvider ? ` · summary by \`${aiProvider}\`` : ''
sections.push(`> Built from commit \`${shortSha}\` on ${date}${providerNote}.`)

process.stdout.write(`${sections.join('\n\n')}\n`)
