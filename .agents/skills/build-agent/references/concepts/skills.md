# Building skills for agents

A **skill** is packaged, on-demand instructions an agent loads when a task
matches — extending capability without bloating the base system prompt. Format
popularized by Claude Code / Agent Skills; consumed by many agents.

## Anatomy
```
skills/<name>/
  SKILL.md            # required: YAML frontmatter + instructions
  references/         # optional: deep docs loaded on demand
  scripts/            # optional: helper scripts the skill runs
  workflows/          # optional: step-by-step procedures
```

`SKILL.md` frontmatter:
```yaml
---
name: <kebab-case-name>
description: >-
  What it does AND when to use it — this is what the agent matches against.
  Pack it with trigger phrases the user would actually say.
# optional:
disable-model-invocation: true   # user-only (/name); for side-effecting flows
---
```

## Principles
- **Progressive disclosure** — keep `SKILL.md` lean; push detail into
  `references/*` and link to them, loaded only when needed.
- **Description = router** — triggering accuracy lives here. Name concrete tasks
  and phrases, not vibes.
- **Idempotent + verifiable** — say how to confirm success; fail loud.
- **Don't embed fast-moving API docs** — link to live sources (see this repo's
  `ai-gateways.md` / framework files for the pattern).
- **Side effects → `disable-model-invocation: true`** + `$ARGUMENTS`.

## Authoring & testing
Use the host `skill-creator` skill/plugin to scaffold, lint, and eval skills:
`/skill-creator <name>`. It checks frontmatter validity and can measure
triggering performance.
