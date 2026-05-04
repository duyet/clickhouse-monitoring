#!/bin/bash
# CI Loop: Check main branch CI every 30 minutes, fix failures automatically
# Run: ./scripts/ci-loop.sh

set -e

INTERVAL_MINUTES=${1:-30}
INTERVAL_SECONDS=$((INTERVAL_MINUTES * 60))

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

get_latest_run() {
  gh run list --branch main --limit 1 --json databaseId,status,conclusion,workflowName,name
}

wait_for_completion() {
  local run_id=$1
  log "Waiting for run $run_id to complete..."
  gh run watch "$run_id" 2>/dev/null || true

  # Poll until status is completed
  while true; do
    status=$(gh run view "$run_id" --json status --jq '.status')
    if [[ "$status" == "completed" ]]; then
      conclusion=$(gh run view "$run_id" --json conclusion --jq '.conclusion')
      log "Run $run_id completed with conclusion: $conclusion"
      echo "$conclusion"
      return 0
    fi
    sleep 10
  done
}

get_failed_jobs() {
  local run_id=$1
  gh run view "$run_id" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | {name: .name, conclusion: .conclusion, databaseId: .databaseId}'
}

analyze_and_fix() {
  local run_id=$1

  log "Analyzing failed run $run_id..."

  # Get failed jobs
  local failed_jobs
  failed_jobs=$(get_failed_jobs "$run_id")

  if [[ -z "$failed_jobs" ]]; then
    log "✅ All jobs passed!"
    return 0
  fi

  log "❌ Failed jobs detected"
  echo "$failed_jobs"

  # Try to auto-fix common issues
  log "Attempting auto-fix..."

  # Pull latest changes
  git fetch origin main
  git checkout main
  git pull

  # Run lint fix
  if command -v biome &>/dev/null; then
    log "Running biome lint fix..."
    bun run lint:fix || true
  fi

  # Check if build passes locally
  log "Running local build..."
  if bun run build; then
    log "✅ Local build passed, committing fixes..."
    git add -A
    if git diff --staged --quiet; then
      log "No changes to commit"
    else
      git commit -m "$(cat <<'EOF'
fix(ci): auto-fix from CI loop

Co-Authored-By: duyetbot <duyetbot@users.noreply.github.com>
EOF
)" || log "No new changes to commit"
      git push
    fi
  else
    log "❌ Local build failed, manual intervention needed"
    return 1
  fi
}

main() {
  log "🔄 CI Loop started (interval: ${INTERVAL_MINUTES}m)"
  log "Press Ctrl+C to stop"

  while true; do
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Get latest run
    latest=$(get_latest_run)
    run_id=$(echo "$latest" | jq -r '.[0].databaseId')
    status=$(echo "$latest" | jq -r '.[0].status')

    log "Latest run: $run_id (status: $status)"

    if [[ "$status" == "completed" ]]; then
      conclusion=$(echo "$latest" | jq -r '.[0].conclusion')

      if [[ "$conclusion" == "success" ]]; then
        log "✅ CI passed - terminating loop"
        break
      else
        log "❌ CI failed - attempting fix..."
        if analyze_and_fix "$run_id"; then
          log "Fix applied, waiting for next CI run..."
        else
          log "⚠️  Could not auto-fix, will retry in ${INTERVAL_MINUTES}m"
        fi
      fi
    else
      log "⏳ Waiting for run to complete..."
      conclusion=$(wait_for_completion "$run_id")

      if [[ "$conclusion" == "success" ]]; then
        log "✅ CI passed - terminating loop"
        break
      else
        log "❌ CI failed - attempting fix..."
        if analyze_and_fix "$run_id"; then
          log "Fix applied, waiting for next CI run..."
        else
          log "⚠️  Could not auto-fix, will retry in ${INTERVAL_MINUTES}m"
        fi
      fi
    fi

    log "⏰ Sleeping for ${INTERVAL_MINUTES} minutes..."
    sleep "$INTERVAL_SECONDS"
  done

  log "✅ CI Loop completed successfully"
}

main
