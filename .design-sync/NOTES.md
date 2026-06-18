# design-sync notes — chmonitor (ClickHouse Monitor UI)

Scope: the shadcn-style UI primitives in `apps/dashboard/src/components/ui` (44 files → 205 PascalCase exports). Target project: **ClickHouse Monitor UI** (`66864c42-e923-4c22-996e-968effad844a`).

## Toolchain / environment
- `node` is an nvm lazy-load shell **function** that fails in non-interactive shells (`command not found: _load_nvm`). Every Bash call must start with: `unset -f node npm npx 2>/dev/null; export PATH="$HOME/.nvm/versions/node/v24.13.0/bin:$PATH"`. Use **v24.13.0** (repo wants node `>=22.22.1`; v22.14 is too old).
- Repo package manager is **bun** (`bun.lock`); deps already installed. Converter deps are isolated in `.ds-sync/` via npm (esbuild, ts-morph, @types/react, @tailwindcss/cli, playwright). The `.ds-sync/package.json` pins them as real deps — do NOT `npm i --no-save <one>` (it prunes the others).
- Chromium for the render check lives at `~/Library/Caches/ms-playwright/` (macOS path, not `~/.cache`). playwright + chromium build 1228.

## Synth-entry setup (no dist — this is a Next/TanStack app, not a published package)
- There is no built component package, so the converter runs in **synth-entry mode** (re-exports every file under `srcDir`).
- `PKG_DIR` resolves via `join(node_modules, pkg)`. To point it at `apps/dashboard`, a self-referential symlink was created: `apps/dashboard/node_modules/dashboard -> ..`. It is gitignored and must be **recreated on a fresh clone**: `ln -sfn .. apps/dashboard/node_modules/dashboard`.
- Build command (run from repo root):
  ```sh
  node .ds-sync/package-build.mjs --config .design-sync/config.json \
    --node-modules apps/dashboard/node_modules --out ./ds-bundle
  ```
  No `--entry` (passing one disables synth mode and breaks component discovery).

## Styling — Tailwind v4 CSS-first (the critical fidelity step)
- Components are styled entirely by Tailwind utility classes generated from `@theme`/`:root` tokens in `apps/dashboard/src/styles.css`. There is **no `tailwind.config.js`** and **no static stylesheet** — utilities only exist after Tailwind compiles.
- The converter cannot run Tailwind, so a compiled stylesheet is produced and wired via `cfg.cssEntry`:
  ```sh
  cd apps/dashboard && \
  ~/project/clickhouse-monitor/.ds-sync/node_modules/.bin/tailwindcss -i src/styles.css -o .ds-tailwind.css
  ```
  Output `apps/dashboard/.ds-tailwind.css` (~339 KB, gitignored). `cfg.cssEntry` is package-relative (`.ds-tailwind.css`).
- **Re-sync must recompile this CSS** whenever `src/styles.css` or component class usage changes, before the converter run.

## Compound components
- shadcn primitives are compound: one file exports many PascalCase parts (Card → CardHeader/CardTitle/CardContent/CardFooter, Select → SelectTrigger/SelectContent/…). All 205 are bundled into `window.ChmUI`.
- Author previews at the **parent/file level** (one composition exercising the subcomponents). Leaf subcomponents that only render inside a parent ride the floor card — composing them inside the parent is the only true render.

## Re-sync risks (watch-list)
- Self-symlink + compiled CSS are both gitignored and machine-generated — recreate both before any re-sync (see above).
- `.ds-tailwind.css` is a snapshot of the app's compiled styles at sync time; it goes stale if the token layer changes. Recompile, don't reuse.
- No `provider` set yet — if components reading theme/context render blank, set `cfg.provider`.
