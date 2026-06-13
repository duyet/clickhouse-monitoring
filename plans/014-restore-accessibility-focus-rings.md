# Plan 014: Restore Visual Focus Indicators (Focus Rings) for Accessibility

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3fba89acc..HEAD -- apps/dashboard-tsr/src/styles.css`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `3fba89acc`, 2026-06-13

## Why this matters

The dashboard stylesheet applies a CSS reset that strips shadows project-wide from all buttons and card surfaces (`box-shadow: none !important;`). This reset prevents unwanted card borders and shadows in dark/light themes. 

However, because the focus indicators (`focus-visible:ring-*` or focus rings) used for keyboard navigation and screen readers rely on CSS `box-shadow` to render the ring outline, this reset completely destroys visual focus indications. This violates accessibility (WCAG 2.1 AA) focus-appearance standards and makes keyboard navigation unusable. Restoring shadows for elements in `:focus-visible` state resolves this accessibility bug.

## Current state

The file `apps/dashboard-tsr/src/styles.css` applies the reset under utilities:

```css
// apps/dashboard-tsr/src/styles.css:135-143
@layer utilities {
  button,
  [role='button'],
  [data-slot='card'],
  .bg-card,
  [class*='bg-card/'] {
    box-shadow: none !important;
  }
}
```

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Install   | `bun install` | exit 0 |
| Build     | `cd apps/dashboard-tsr && bun run build` | compiles styles and builds app successfully |
| Lint      | `biome lint .` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `apps/dashboard-tsr/src/styles.css`

**Out of scope**:
- Customizing component typescript files to add focus styles (we should rely on the existing Tailwind utility classes already present in the components).

## Git workflow

- Branch: `advisor/014-restore-accessibility-focus-rings`
- Commit message: `accessibility(dashboard-tsr): restore focus-ring indicators by preserving focus-visible shadows`
- Co-authorship footer:
  ```
  Co-Authored-By: duyetbot <bot@duyet.net>
  ```

## Steps

### Step 1: Update styles.css to skip focus-visible elements in shadow reset

Open [styles.css](file:///Users/duet/project/clickhouse-monitor/apps/dashboard-tsr/src/styles.css). Modify the selectors in the `@layer utilities` block to use the `:not(:focus-visible)` pseudo-class. This ensures the shadow reset is bypassed when an element receives keyboard focus.

Replace lines 136-140:
```css
  button,
  [role='button'],
  [data-slot='card'],
  .bg-card,
  [class*='bg-card/'] {
```

With:
```css
  button:not(:focus-visible),
  [role='button']:not(:focus-visible),
  [data-slot='card']:not(:focus-visible),
  .bg-card:not(:focus-visible),
  [class*='bg-card/']:not(:focus-visible) {
```

**Verify**: Run `cd apps/dashboard-tsr && bun run build` to verify the CSS compiles successfully.

## Test plan

- Start the development server (`bun run dev:tsr` from root).
- Open the application in a browser, click somewhere to reset focus, and press `Tab` repeatedly to navigate through buttons and cards.
- Verify that a clear visual outline focus ring (blue/indigo focus ring) appears around each button as it receives focus.

## Done criteria

- [ ] `styles.css` compiled successfully during build.
- [ ] Keyboard navigation focus indicators are visible on all interactive buttons and components.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- If using `:not(:focus-visible)` causes CSS parsing errors in the PostCSS/Vite compilation pipeline (revert to standard focus overrides).
