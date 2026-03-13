# Simplified Testing & Workflows Plan

## Current State (Heavy)
- 99 Cypress component tests (DISABLED in CI due to Next.js 16 issue)
- 4 E2E tests × 3 browsers × 13 ClickHouse versions = **39 jobs**
- 44 Jest unit tests (fast, keep these)
- Query config tests × 13 ClickHouse versions = **13 jobs**
- **Total: ~52+ jobs per CI run**

## Proposed Simplification

### 1. Simplify test.yml
**Current: 52+ jobs**
**Proposed: 3 jobs**

| Job | Changes | Time Savings |
|-----|---------|--------------|
| e2e-test | Chrome only, latest ClickHouse (25.6) | 39 → 1 job |
| unit-tests | Keep as is (fast) | No change |
| test-queries-config | Test latest version only | 13 → 1 job |

**Result: 52+ jobs → 3 jobs (~15-20 min total)**

### 2. Workflows to Keep
| Workflow | Purpose | Action |
|----------|---------|--------|
| cloudflare.yml | Deployments to Cloudflare | Keep |
| test.yml | CI testing | Simplify |
| ci.yml | Docker image builds | Keep (separate purpose) |

### 3. Workflows to Remove
| Workflow | Reason |
|----------|--------|
| claude.yml | AI review - can use manual PR review |
| claude-nightly.yml | Nightly AI review - redundant |
| claude-code-review.yml | AI review - redundant |
| docs.yml | Only runs on docs/ changes - low value |
| release.yml | Can use GitHub Releases feature |
| base.yml | Reusable workflow - can inline |

### 4. Component Tests
- Keep 99 component tests for local development
- Keep CI disabled until Next.js 16 + Cypress turbopack issue is resolved

### 5. Jest Unit Tests
- Keep 44 tests (fast, ~1-2 min)
- No changes needed

## Implementation Order
1. Simplify test.yml
2. Delete redundant workflows
3. Test the simplified CI

## Expected Benefits
- **Speed**: CI from ~60+ min → ~15-20 min
- **Cost**: Fewer GitHub Actions minutes
- **Maintenance**: Less workflow code to maintain
- **Reliability**: Fewer moving parts = fewer failures
