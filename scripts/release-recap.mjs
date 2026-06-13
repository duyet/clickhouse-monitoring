// Computes a deterministic "release recap" from git history + the GitHub API and
// emits two files:
//   recap.md         a markdown stats block for the release body
//   recap-facts.txt  compact plain-text facts fed to the LLM so its narrative
//                    recap (a blockquote) can reference real numbers
//
// Best-effort: anything that needs the GitHub API is wrapped so the git-derived
// stats (commits, days, pace, day/night) always render even if `gh` is missing
// or rate-limited. Shared verbatim across every duyet repo.
//
// Env: RANGE (e.g. v0.2.7..HEAD or HEAD), RELEASE_TAG, PREVIOUS_TAG,
//      GITHUB_REPOSITORY, GH_TOKEN/GITHUB_TOKEN (for gh api).

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const env = (k) => (process.env[k] ?? '').trim()
const RANGE = env('RANGE') || 'HEAD'
const REPO = env('GITHUB_REPOSITORY')
const MAX_PRS = 40

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
const ghJson = (path) => {
  try {
    return JSON.parse(sh(`gh api "${path}" --paginate 2>/dev/null`))
  } catch {
    return null
  }
}

const isAgent = (login, type) =>
  type === 'Bot' ||
  /(\[bot\]|^.*bot$|copilot|claude|codex|cursor|devin|sweep|gemini|duyetbot|dependabot|renovate)/i.test(login || '')

// --- git-derived stats ---
let lines = []
try {
  lines = sh(`git log --no-merges --pretty=format:'%H%x09%cI%x09%an%x09%s' ${RANGE}`)
    .split('\n')
    .filter(Boolean)
} catch {
  lines = []
}

const commitCount = lines.length
const authors = new Set()
const prNums = new Set()
let day = 0
let night = 0
let minT = Infinity
let maxT = -Infinity
for (const l of lines) {
  const [, iso, an, subj] = l.split('\t')
  if (an) authors.add(an)
  const t = Date.parse(iso)
  if (!Number.isNaN(t)) {
    minT = Math.min(minT, t)
    maxT = Math.max(maxT, t)
    const h = new Date(t).getUTCHours()
    if (h >= 6 && h < 18) day++
    else night++
  }
  const m = (subj || '').match(/\(#(\d+)\)/) || (subj || '').match(/#(\d+)/)
  if (m) prNums.add(m[1])
}

const spanDays = maxT > minT ? Math.max(1, Math.round((maxT - minT) / 86400000)) : 1
const pace = commitCount ? (commitCount / spanDays).toFixed(1) : '0'

// --- GitHub API stats (best-effort) ---
const agentStats = new Map() // login -> {comments, reviews, approvals, type}
let totalComments = 0
const prList = [...prNums].slice(0, MAX_PRS)
const involved = new Set()

const bump = (login, type, field) => {
  if (!login) return
  involved.add(login)
  if (!isAgent(login, type)) return
  const s = agentStats.get(login) || { comments: 0, reviews: 0, approvals: 0 }
  s[field]++
  agentStats.set(login, s)
}

if (REPO) {
  for (const n of prList) {
    const issueComments = ghJson(`repos/${REPO}/issues/${n}/comments?per_page=100`) || []
    const reviewComments = ghJson(`repos/${REPO}/pulls/${n}/comments?per_page=100`) || []
    const reviews = ghJson(`repos/${REPO}/pulls/${n}/reviews?per_page=100`) || []
    for (const c of [...issueComments, ...reviewComments]) {
      totalComments++
      bump(c.user?.login, c.user?.type, 'comments')
    }
    for (const r of reviews) {
      bump(r.user?.login, r.user?.type, 'reviews')
      if (r.state === 'APPROVED') bump(r.user?.login, r.user?.type, 'approvals')
    }
  }
}

const agents = [...agentStats.entries()]
  .map(([login, s]) => ({ login, ...s, score: s.comments + s.reviews }))
  .sort((a, b) => b.score - a.score)
const topAgent = agents[0]

// --- render ---
const dayNight = day + night > 0 ? `🌞 ${day} daytime · 🌙 ${night} night-time` : ''
const md = ['## 📊 Release recap', '']
md.push(`- 📦 **${commitCount} commit${commitCount === 1 ? '' : 's'}**${prNums.size ? ` across **${prNums.size} pull request${prNums.size === 1 ? '' : 's'}**` : ''}`)
md.push(`- 🗓️ Shipped over **${spanDays} day${spanDays === 1 ? '' : 's'}** — pace **~${pace} commits/day**`)
if (dayNight) md.push(`- ${dayNight} commits`)
if (authors.size) md.push(`- 👥 **${authors.size} contributor${authors.size === 1 ? '' : 's'}**`)
if (totalComments) md.push(`- 💬 **${totalComments} comment${totalComments === 1 ? '' : 's'}** back and forth across reviews`)
if (agents.length) md.push(`- 🤖 **${agents.length} AI agent${agents.length === 1 ? '' : 's'}** involved`)
if (topAgent) {
  md.push(
    `- 🏆 Shoutout to **@${topAgent.login}** — ${topAgent.comments} comment${topAgent.comments === 1 ? '' : 's'}, ${topAgent.reviews} code review${topAgent.reviews === 1 ? '' : 's'}, ${topAgent.approvals} approval${topAgent.approvals === 1 ? '' : 's'}`,
  )
}
writeFileSync('recap.md', `${md.join('\n')}\n`)

const facts = [
  `commits: ${commitCount}`,
  `pull_requests: ${prNums.size}`,
  `span_days: ${spanDays}`,
  `pace_per_day: ${pace}`,
  `daytime_commits: ${day}`,
  `nighttime_commits: ${night}`,
  `contributors: ${authors.size}`,
  `review_comments: ${totalComments}`,
  `agents_involved: ${agents.length}`,
  topAgent
    ? `most_active_agent: @${topAgent.login} (${topAgent.comments} comments, ${topAgent.reviews} reviews, ${topAgent.approvals} approvals)`
    : 'most_active_agent: none',
].join('\n')
writeFileSync('recap-facts.txt', `${facts}\n`)
process.stdout.write(`${md.join('\n')}\n`)
