# Implementation Plan: CI/CD Optimization and Pre-commit Quality Checks (Simplified)

**Branch**: `003-ci-optimization-precommit` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ci-optimization-precommit/spec.md`

## Summary

Implement pre-commit quality checks and optimize CI workflows using GitHub's native `paths` feature. The goal is to catch errors locally before CI runs and skip unnecessary CI steps for documentation-only or isolated code changes, using the simplest possible approach with minimal custom code.

**Key Insight**: GitHub Actions already provides `paths` and `paths-ignore` filtering - we should use that instead of building custom file categorization logic. Pre-commit hooks should be simple: Prettier → ESLint → TypeScript.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20 LTS, Bash (GitHub Actions)
**Primary Dependencies**: Husky 8.x (git hooks), lint-staged 15.x (staged file linting)
**Storage**: N/A (stateless CI optimization)
**Testing**: Vitest (for any utility functions), manual validation (commit testing)
**Target Platform**: GitHub Actions (Ubuntu latest), developer machines (macOS/Linux/Windows with Git Bash)
**Project Type**: Web (monorepo with frontend/, backend/, shared/)
**Performance Goals**: Pre-commit checks <30s, docs-only CI <2min (vs ~5min full pipeline)
**Constraints**: Zero additional CI cost, backward compatible, simple to maintain
**Scale/Scope**: 3 user stories, minimal custom code (~100 lines total vs current 4000+)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 1. TDD Compliance ✅
**Status**: PASS
- Pre-commit hooks can be tested by making commits with intentional errors
- CI workflow changes can be tested by creating PRs with specific file changes
- No complex business logic requiring extensive unit tests

### 2. Modularity ✅
**Status**: PASS
- Pre-commit hooks are independently testable (`.husky/pre-commit` script)
- CI workflows are separate files per concern (lint.yml, frontend.yml, backend.yml, deploy.yml)
- Single responsibility: each workflow handles one aspect

### 3. Performance Impact ✅
**Status**: PASS
**Benchmarks**:
- Pre-commit checks target: <30 seconds for typical commits
- Documentation-only CI target: <2 minutes
- Isolated code changes target: ~40% faster than full pipeline

### 4. Architecture Alignment ✅
**Status**: PASS
- Pre-commit hooks run locally (client-side)
- CI optimization happens on GitHub infrastructure (server-side)
- Clear separation of concerns

### 5. Observability ✅
**Status**: PASS
- Pre-commit hooks show clear pass/fail messages
- GitHub Actions provides built-in logging
- Workflow summaries show which paths triggered which workflows

### 6. Mobile-First Design ✅
**Status**: N/A - This is a development tooling feature, not UI

### 7. Universal Accessibility ✅
**Status**: N/A - This is a development tooling feature, not UI

### 8. ADR Documentation ✅
**Status**: PASS
- ADR 005 will document the simplified approach
- Decision to use native GitHub `paths` feature vs custom logic
- Rationale for simplicity over flexibility

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Replacing 4000 lines with ~100 lines | Over-engineered solution deployed | N/A - **simplifying** to reduce complexity |

**Justification for Simplification**:
The current implementation has ~4000 lines of custom file categorization logic, type definitions, unit tests, and bash scripting. This violates the principle of simplicity. GitHub Actions already provides `paths` and `paths-ignore` filtering that accomplishes the same goals with zero custom code.

## Project Structure

### Documentation (this feature)

```text
specs/003-ci-optimization-precommit/
├── plan.md              # This file (SIMPLIFIED VERSION)
├── research.md          # Comparison of approaches
├── data-model.md        # Minimal (just workflow triggers)
├── quickstart.md        # Developer guide
├── contracts/           # N/A for this feature
└── tasks.md             # Implementation tasks
```

### Source Code (repository root)

```text
# Pre-commit hooks
.husky/
└── pre-commit           # Simple script: lint-staged → type-check

# GitHub Actions (SIMPLIFIED - use native paths feature)
.github/workflows/
├── lint.yml             # Runs on all PRs except docs-only
├── frontend.yml         # Runs only when frontend/** or shared/** changes
├── backend.yml          # Runs only when backend/** or shared/** changes
└── deploy.yml           # Runs on push to main, skips for docs-only

# Configuration
package.json             # lint-staged config, scripts
.prettierignore          # Prettier ignore patterns
```

**Structure Decision**: Use GitHub's native workflow separation instead of one complex workflow with conditional logic. Each workflow uses `paths` filtering to run only when relevant files change.

## Phase 0: Research & Decision Making

### Research Questions

1. **Q**: Can GitHub Actions `paths` feature handle all our use cases?
   **A**: YES - `paths` and `paths-ignore` can filter on file patterns like `frontend/**`, `**/*.md`, etc.

2. **Q**: What are the limitations of `paths` filtering?
   **A**: Workflows don't run if filtered out. But this is exactly what we want - no wasted CI minutes.

3. **Q**: Do we need custom file categorization logic?
   **A**: NO - GitHub handles it natively. We were over-engineering.

4. **Q**: Should pre-commit hooks run ALL tests or just lint?
   **A**: Just format + lint + type-check. Tests should run in CI (faster feedback loop).

### Decision: Simplified Approach

**We will**:
- Use GitHub Actions `paths` and `paths-ignore` for all CI filtering
- Create separate workflow files per concern (lint, frontend, backend, deploy)
- Keep pre-commit hooks simple: Prettier → ESLint → TypeScript type-check
- Remove all custom file categorization logic (~4000 lines → ~100 lines)

**Rationale**:
1. **Simplicity**: Platform features > custom code
2. **Maintainability**: Less code = fewer bugs
3. **Readability**: Separate workflows are easier to understand than one complex workflow
4. **Performance**: Same end result with 97% less code

**Alternatives Considered**:
1. ❌ Custom bash file detection (current implementation) - Too complex, reinvents GitHub features
2. ❌ TypeScript categorization engine - Over-engineering, not needed
3. ✅ Native `paths` filtering - Simple, maintained by GitHub, zero custom code

### Research Output

See [research.md](./research.md) for detailed analysis of:
- GitHub Actions `paths` feature capabilities
- Husky + lint-staged best practices
- Comparison of current vs simplified approach

## Phase 1: Design

### Data Model

**Entities** (minimal):

1. **Git Hook Execution**
   - Tool: Husky (manages hooks)
   - Steps: lint-staged (Prettier + ESLint on staged files) → type-check (entire project)
   - Exit codes: 0 (pass) or non-zero (fail, block commit)

2. **GitHub Actions Workflow Triggers**
   - Event: `pull_request` or `push`
   - Path filters: e.g., `paths: ['frontend/**', 'shared/**']`
   - Result: Workflow runs only if matching files changed

### Architecture

**Pre-commit Flow**:
```
Developer runs: git commit
  ↓
Husky pre-commit hook executes
  ↓
lint-staged runs Prettier + ESLint on staged files
  ↓
pnpm run type-check (all workspaces)
  ↓
If any fail → commit blocked, show errors
If all pass → commit succeeds
```

**CI Flow (Simplified)**:
```
PR opened/updated
  ↓
GitHub evaluates path filters for each workflow
  ↓
lint.yml: runs if any non-markdown files changed
frontend.yml: runs if frontend/** or shared/** changed
backend.yml: runs if backend/** or shared/** changed
  ↓
Each workflow runs independently, in parallel
```

**Deploy Flow**:
```
Push to main
  ↓
deploy.yml evaluates paths-ignore: ['**/*.md', 'docs/**']
  ↓
If docs-only → workflow skips
If code changed → full deployment runs
```

### Contracts

**Pre-commit Hook Contract** (`.husky/pre-commit`):
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."
pnpm exec lint-staged

echo "🔎 Type checking..."
pnpm run type-check

echo "✅ Pre-commit checks passed!"
```

**lint-staged Configuration** (`package.json`):
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "prettier --write",
      "eslint --fix"
    ]
  }
}
```

**Workflow Path Filters** (examples):

```yaml
# .github/workflows/frontend.yml
on:
  pull_request:
    paths:
      - 'frontend/**'
      - 'shared/**'
      - 'package.json'
      - 'pnpm-lock.yaml'

# .github/workflows/lint.yml
on:
  pull_request:
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
      - '.github/ISSUE_TEMPLATE/**'
      - '.github/PULL_REQUEST_TEMPLATE/**'
```

### File Changes

**New Files** (~100 lines total):
- `.husky/pre-commit` (~10 lines)
- `.prettierignore` (~15 lines)
- `.github/workflows/lint.yml` (~30 lines)
- `.github/workflows/frontend.yml` (~35 lines)
- `.github/workflows/backend.yml` (~35 lines)
- `.github/workflows/deploy.yml` (updated, ~40 lines)

**Modified Files**:
- `package.json` (add lint-staged config, scripts)
- `README.md` (add pre-commit hooks section)
- `docs/adr/005-precommit-hooks-and-ci-optimization.md` (update with simplified approach)

**Removed Files** (from over-engineered implementation):
- ❌ `scripts/categorize-files.ts` (~220 lines)
- ❌ `scripts/__tests__/categorize-files.test.ts` (~350 lines)
- ❌ `scripts/get-changed-files.sh` (~30 lines)
- ❌ `shared/src/types/file-categorization.ts` (~100 lines)
- ❌ `shared/src/types/precommit-checks.ts` (~50 lines)
- ❌ Complex bash logic in ci.yml (~100 lines)

**Net Result**: ~750 lines removed, ~165 lines added = **~585 lines less code** for same functionality

### Quickstart Guide

See [quickstart.md](./quickstart.md) for:
- Developer setup (automatic with `pnpm install`)
- Making your first commit with pre-commit hooks
- Understanding CI workflow triggers
- Troubleshooting common issues

## Implementation Strategy

### Phase 2: MVP (User Story 1 - Pre-commit Hooks)

**Goal**: Catch formatting, linting, and type errors before CI

**Tasks**:
1. Install Husky and lint-staged
2. Configure lint-staged in package.json
3. Create `.husky/pre-commit` hook
4. Add `type-check` script to package.json
5. Test with intentional errors
6. Update ADR 005 with simplified approach

**Validation**: Make commit with format/lint/type errors → blocked with clear messages

### Phase 3: CI Optimization (User Stories 2 & 3)

**Goal**: Skip unnecessary CI steps using GitHub's native `paths` feature

**Tasks**:
1. Create `.github/workflows/lint.yml` (runs on all non-docs PRs)
2. Create `.github/workflows/frontend.yml` (runs on frontend/** changes)
3. Create `.github/workflows/backend.yml` (runs on backend/** changes)
4. Update `.github/workflows/deploy.yml` with `paths-ignore` for docs
5. Remove old complex ci.yml with bash logic
6. Test with docs-only PR → verify linting skipped, builds skipped
7. Test with frontend-only PR → verify backend CI skipped

**Validation**:
- Docs PR completes in <2 min (vs ~5 min)
- Frontend PR skips backend tests/build
- Backend PR skips frontend tests/build

### Phase 4: Documentation & Cleanup

**Tasks**:
1. Update README.md with pre-commit hooks section
2. Update quickstart.md with troubleshooting
3. Finalize ADR 005 with decision rationale
4. Remove unused code (categorize-files.ts, tests, types)
5. Update this plan.md with lessons learned

## Success Metrics

### Pre-commit Hooks (User Story 1)
- ✅ Execution time: <30 seconds for typical commit
- ✅ Error detection: 90%+ of format/lint/type issues caught locally
- ✅ Developer feedback: Clear error messages, <10s to understand issue

### CI Optimization (User Stories 2 & 3)
- ✅ Docs-only PRs: <2 minutes (vs ~5 minutes) - **60% faster**
- ✅ Frontend-only PRs: ~40% faster (skip backend)
- ✅ Backend-only PRs: ~40% faster (skip frontend)
- ✅ Code reduction: **~585 fewer lines** of custom logic

### Simplicity Metrics
- ✅ Lines of code: ~165 (vs current ~4000) - **96% reduction**
- ✅ Files changed: ~10 (vs current ~24) - **58% reduction**
- ✅ Maintenance burden: Minimal (uses platform features)
- ✅ Understanding: Any developer can read workflows in <5 minutes

## Risk Assessment

### Low Risk ✅
- **Using platform features**: GitHub maintains `paths` filtering, not us
- **Husky stability**: Mature, widely-used tool
- **Backward compatible**: Old workflows can coexist during transition

### Medium Risk ⚠️
- **Path filter edge cases**: Shared code changes trigger all workflows (intentional)
- **Pre-commit bypass**: Developers can use `--no-verify` (document in quickstart)

### Mitigation
- Document expected workflow triggers in ADR
- Add troubleshooting guide for common scenarios
- Keep emergency bypass documented and available

## Post-Implementation Review

After deployment, evaluate:
1. **Did simplification work?** Measure CI time savings, developer satisfaction
2. **Any missing features?** Document if custom categorization becomes needed
3. **Maintenance cost?** Track time spent on workflow issues vs old approach

**Hypothesis**: The simplified approach will be easier to maintain, understand, and extend than the custom categorization engine.

---

**Next Command**: `/speckit.tasks` to generate implementation tasks from this simplified plan
