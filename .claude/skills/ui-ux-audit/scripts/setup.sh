#!/usr/bin/env bash
# Idempotent setup for the UI/UX audit toolchain. Installs Playwright + axe-core +
# image-diff deps into a tools dir OUTSIDE the repo (so it never pollutes the
# project's node_modules), and downloads the Chromium browser binary.
#
# Safe to re-run; it only installs what's missing.
set -euo pipefail

TOOLS="${CHM_QA_TOOLS:-$HOME/.config/chmonitor/qa-tools}"
mkdir -p "$TOOLS"
cd "$TOOLS"

# Load node (nvm) for non-interactive shells.
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
nvm use default >/dev/null 2>&1 || true

[ -f package.json ] || echo '{"name":"chm-qa-tools","private":true}' > package.json

need=()
for pkg in playwright @axe-core/playwright pixelmatch pngjs; do
  node -e "require.resolve('$pkg')" 2>/dev/null || need+=("$pkg")
done

if [ "${#need[@]}" -gt 0 ]; then
  echo "Installing: ${need[*]}"
  bun add -d "${need[@]}"
else
  echo "All node deps already present."
fi

# Ensure Chromium is installed for Playwright.
bun x playwright install chromium >/dev/null 2>&1 || bun x playwright install chromium

# Make the audit runner resolvable from any cwd: symlink node_modules into the
# skill's scripts dir (bun/node resolve bare imports from the script's own dir).
# The symlink is gitignored — it points outside the repo.
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ln -sfn "$TOOLS/node_modules" "$SCRIPTS_DIR/node_modules"

echo "Tools ready at: $TOOLS"
echo "Run the audit from anywhere, e.g.:  bun $SCRIPTS_DIR/audit.mjs --target=local"
