/**
 * Landing-side pricing data — the single source for the Pricing section AND the
 * dedicated /pricing page (cards, comparison matrix, FAQ), so they can never
 * drift from each other.
 *
 * ⚠️ These numbers MUST stay identical to the real source of truth:
 * apps/dashboard/src/lib/billing/plans.ts (BILLING_PLANS). The landing app is a
 * standalone, dependency-light Astro app and cannot import that module without
 * dragging app deps in, so the values are mirrored here by hand. When you change
 * a price / seat / host / limit / capability in plans.ts, update this file too.
 */

export interface PricingTier {
  name: string
  badge?: { label: string; cls: string }
  highlight?: boolean
  monthly: number | null // null = custom
  yearlyTotal: number | null
  yearlyPerMo: number | null
  tagline: string
  rows: string[]
  cta: { label: string; href: string; primary?: boolean }
}

const DASH = 'https://dash.chmonitor.dev'

export const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    badge: { label: 'Early access', cls: 'ptag-beta' },
    monthly: 0,
    yearlyTotal: 0,
    yearlyPerMo: 0,
    tagline: 'Try the hosted dashboard, no setup.',
    rows: [
      '1 ClickHouse host, 1 seat',
      'Full monitoring dashboard',
      'AI agent — 25 requests/day trial',
      '7-day history',
      'Community support',
    ],
    cta: { label: 'Start free', href: DASH, primary: true },
  },
  {
    name: 'Pro',
    highlight: true,
    monthly: 29,
    yearlyTotal: 290,
    yearlyPerMo: 24,
    tagline: 'For a small team running a few clusters.',
    rows: [
      'Everything in Free',
      '3 hosts, 3 seats',
      'AI agent + scheduled AI Insights',
      'Basic alerting — up to 10 rules',
      'Anomaly detection + data export',
      '30-day history',
      'Email support',
    ],
    cta: { label: 'Start free', href: DASH, primary: true },
  },
  {
    name: 'Max',
    monthly: 99,
    yearlyTotal: 990,
    yearlyPerMo: 83,
    tagline: 'For teams operating a fleet of clusters.',
    rows: [
      'Everything in Pro',
      '10 hosts, 10 seats',
      'Higher AI usage cap',
      'Fleet view + advanced alerting',
      'Custom dashboards + webhooks',
      'API / MCP access · 50 alert rules',
      '90-day history · priority support',
    ],
    cta: { label: 'Start free', href: DASH },
  },
  {
    name: 'Enterprise',
    monthly: null,
    yearlyTotal: null,
    yearlyPerMo: null,
    tagline: 'For organisations with security & scale needs.',
    rows: [
      'Everything in Max',
      'Unlimited hosts & seats',
      'Bring-your-own LLM key (BYOK)',
      'SSO / SAML, RBAC, audit logs',
      'Custom retention',
      'SLA & dedicated support',
    ],
    cta: { label: 'Contact us', href: 'mailto:hello@chmonitor.dev' },
  },
]

/** A comparison cell: true (✓), false (—), or a literal string. */
export type CompareCell = boolean | string

export interface CompareRow {
  label: string
  /** [Free, Pro, Max, Enterprise] */
  values: [CompareCell, CompareCell, CompareCell, CompareCell]
}

export interface CompareGroup {
  group: string
  rows: CompareRow[]
}

/** Plan column order for the matrix header. */
export const compareColumns = ['Free', 'Pro', 'Max', 'Enterprise'] as const

export const compareGroups: CompareGroup[] = [
  {
    group: 'Limits',
    rows: [
      { label: 'ClickHouse hosts', values: ['1', '3', '10', 'Unlimited'] },
      { label: 'Team seats', values: ['1', '3', '10', 'Unlimited'] },
      { label: 'Alert rules', values: ['—', '10', '50', 'Unlimited'] },
      {
        label: 'History retention',
        values: ['7 days', '30 days', '90 days', 'Custom'],
      },
      {
        label: 'AI usage',
        values: ['25/day trial', '$5/mo', '$20/mo', 'BYOK'],
      },
    ],
  },
  {
    group: 'Features',
    rows: [
      {
        label: 'Full monitoring dashboard',
        values: [true, true, true, true],
      },
      { label: 'AI agent', values: [true, true, true, true] },
      {
        label: 'Scheduled AI Insights',
        values: [false, true, true, true],
      },
      {
        label: 'Alerting',
        values: [false, 'Basic', 'Advanced', 'Advanced'],
      },
      { label: 'Anomaly detection', values: [false, true, true, true] },
      { label: 'Data export & reports', values: [false, true, true, true] },
      { label: 'Custom dashboards', values: [false, false, true, true] },
      { label: 'Webhook integrations', values: [false, false, true, true] },
      { label: 'Fleet view', values: [false, false, true, true] },
      { label: 'API / MCP access', values: [false, false, true, true] },
      {
        label: 'SSO / SAML, RBAC, audit logs',
        values: [false, false, false, true],
      },
      {
        label: 'Support',
        values: ['Community', 'Email', 'Priority', 'SLA + dedicated'],
      },
    ],
  },
]

export interface PricingFaq {
  q: string
  a: string
}

export const pricingFaqs: PricingFaq[] = [
  {
    q: 'Is self-hosting really free?',
    a: 'Yes. chmonitor is open source under GPL-3.0. Run it on your own infrastructure (Docker, Cloudflare Workers, Kubernetes) with every feature, unlimited clusters, and your data never leaving your network — at no cost, forever.',
  },
  {
    q: "What's a “host”?",
    a: 'A host is a single ClickHouse connection (one cluster endpoint). Your plan caps how many hosts you can connect to the hosted dashboard at once. Self-hosting has no host limit.',
  },
  {
    q: 'How does AI usage metering work?',
    a: 'The Free plan includes a daily trial allowance of AI agent requests. Paid plans get a monthly LLM spend budget instead (Pro $5/mo, Max $20/mo). Enterprise brings its own LLM key (BYOK) for unlimited usage.',
  },
  {
    q: 'What happens when I hit a plan limit?',
    a: 'Limits fail gracefully — you keep full access to everything already in use and see a clear prompt to upgrade. Nothing is deleted or interrupted; you simply cannot add beyond the cap until you upgrade.',
  },
  {
    q: 'Can I change plans or cancel anytime?',
    a: 'Yes. Upgrade, downgrade, or cancel from the in-app billing portal at any time. Paid access continues until the end of the period you have already paid for, then cleanly returns to Free.',
  },
  {
    q: 'Is annual billing cheaper?',
    a: 'Yes — annual billing is 10× the monthly price, so you get roughly two months free versus paying month to month.',
  },
  {
    q: 'Do you read or write my data?',
    a: 'chmonitor only reads from ClickHouse system tables and never writes to your data. Connect with a least-privilege SELECT-only user for maximum safety.',
  },
]
