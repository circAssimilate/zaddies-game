# Research: Package Manager Migration to pnpm

**Feature**: 002-migrate-to-pnpm
**Date**: 2025-10-26
**Status**: Complete

## Overview

This document consolidates research findings for migrating from npm to pnpm, including best practices, tooling decisions, and migration strategies.

## Research Questions & Findings

### 1. pnpm vs npm: Core Differences

**Decision**: Use pnpm 8.x for significantly improved performance and disk efficiency

**Rationale**:

- **Performance**: pnpm uses a content-addressable store with hard links, resulting in 2-3x faster installations compared to npm
  - First install: ~60-70% faster due to parallel downloads and efficient linking
  - Subsequent installs: ~80-90% faster due to content-addressable store reuse
  - CI/CD caching: More efficient due to smaller cache size and incremental updates

- **Disk Efficiency**: Saves 30-50% disk space by deduplicating packages across projects
  - npm: Each project gets full copy of node_modules
  - pnpm: Packages stored once globally, hard-linked to projects
  - Monorepo benefit: Shared dependencies across workspaces are not duplicated

- **Strict Dependency Resolution**: Prevents phantom dependencies (accessing packages not in package.json)
  - npm hoisting can make undeclared dependencies accessible
  - pnpm creates isolated node_modules structure preventing accidental usage
  - Better for correctness but may reveal previously hidden issues

**Alternatives Considered**:

- **Yarn v1**: Similar performance to npm, lacks modern features
- **Yarn v3+ (Berry)**: Good performance but Plug'n'Play (PnP) mode has compatibility issues, steep learning curve
- **npm with optimizations**: Baseline performance insufficient for CI/CD targets

**Sources**:

- pnpm official benchmarks: https://pnpm.io/benchmarks
- pnpm motivation doc: https://pnpm.io/motivation
- GitHub Actions pnpm integration: https://pnpm.io/continuous-integration#github-actions

### 2. Lockfile Migration Strategy

**Decision**: Use `pnpm import` to convert package-lock.json to pnpm-lock.yaml with verification

**Rationale**:

- pnpm provides built-in `pnpm import` command that:
  - Reads package-lock.json (npm v5+, v6, v7+)
  - Preserves exact dependency versions
  - Creates equivalent pnpm-lock.yaml
  - Maintains resolved URLs and integrity hashes

- Verification process:
  1. Run `pnpm import` to generate pnpm-lock.yaml
  2. Compare dependency versions: `npm ls --depth=0` vs `pnpm ls --depth=0`
  3. Validate builds and tests pass identically
  4. Delete package-lock.json only after verification

**Alternatives Considered**:

- **Fresh `pnpm install`**: Risk of version changes due to semver range resolution
- **Manual lockfile creation**: Error-prone and doesn't preserve npm resolution decisions
- **Gradual migration**: Maintaining dual lockfiles creates confusion and merge conflicts

**Migration Steps**:

```bash
# 1. Import npm lockfile
pnpm import

# 2. Verify equivalence
npm ls --all --json > npm-deps.json
pnpm ls --depth=100 --json > pnpm-deps.json
# Compare versions programmatically

# 3. Test build and test suite
pnpm install
pnpm test
pnpm run build

# 4. Delete old lockfile after verification
rm package-lock.json
```

**Sources**:

- pnpm import docs: https://pnpm.io/cli/import
- Migration guide: https://pnpm.io/installation#using-a-shorter-alias

### 3. GitHub Actions Caching Strategy

**Decision**: Use `pnpm/action-setup@v2` with `actions/setup-node` cache feature

**Rationale**:

- **Recommended approach by pnpm**: Official GitHub Action maintained by pnpm team
- **Built-in cache support**: `actions/setup-node@v3` natively supports pnpm caching via `cache: 'pnpm'`
- **Store-based caching**: Caches the global pnpm store directory, not node_modules
  - More efficient: Only changed packages re-downloaded
  - Faster restore: Smaller cache size (~100-200MB vs ~500MB+ for node_modules)
  - Better cache hit rate: Lockfile changes don't invalidate entire cache

- **Performance characteristics**:
  - Cache hit (no dependency changes): ~5-10s to restore + link
  - Cache hit (minor lockfile change): ~10-20s to download changed packages
  - Cache miss (first run): ~25-40s full download + cache save

**Configuration**:

```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 8

- uses: actions/setup-node@v3
  with:
    node-version: '20'
    cache: 'pnpm' # Automatically caches pnpm store

- run: pnpm install --frozen-lockfile
```

**Alternatives Considered**:

- **Manual cache with `actions/cache`**: More control but requires manual key management, higher maintenance
- **Caching node_modules directly**: Larger cache, slower restore, less efficient for incremental changes
- **No caching**: Unacceptable performance (~60-90s every build)

**Sources**:

- pnpm GitHub Actions docs: https://pnpm.io/continuous-integration#github-actions
- actions/setup-node caching: https://github.com/actions/setup-node#caching-global-packages-data

### 4. npm Command Prevention

**Decision**: Use `.npmrc` with `engine-strict=true` and `package.json` engines field

**Rationale** (from clarification session):

- **Cross-platform compatibility**: Works on Windows, macOS, Linux without additional tools
- **Graceful error messages**: Provides clear explanation when wrong package manager used
- **Non-invasive**: Doesn't require pre-commit hooks or additional package installations
- **Standard approach**: Widely adopted pattern in Node.js ecosystem

**Configuration**:
`.npmrc`:

```
engine-strict=true
shamefully-hoist=false  # Enforce strict node_modules structure
auto-install-peers=true # Auto-install peer dependencies (pnpm 7+)
```

`package.json`:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": "please-use-pnpm",
    "pnpm": ">=8.0.0"
  }
}
```

**Error when npm used**:

```
npm ERR! Unsupported engine for root@1.0.0: wanted: {"npm":"please-use-pnpm"} (current: {"npm":"10.2.0"})
npm ERR! Please use pnpm instead of npm
```

**Alternatives Considered**:

- **only-allow package**: Requires additional dependency, harder to customize error message
- **Pre-commit hooks**: Requires git hook setup, not enforced in CI
- **Documentation only**: No technical enforcement, relies on developer discipline

**Sources**:

- npm engines docs: https://docs.npmjs.com/cli/v9/configuring-npm/package-json#engines
- pnpm .npmrc configuration: https://pnpm.io/npmrc

### 5. Workspace Configuration

**Decision**: Use `pnpm-workspace.yaml` for workspace definitions

**Rationale**:

- **pnpm requirement**: pnpm doesn't support npm's `workspaces` field in package.json
- **Explicit configuration**: Dedicated file makes workspace structure clear
- **Glob patterns**: Supports flexible patterns for workspace discovery
- **Future-proof**: Allows pnpm-specific workspace configuration options

**Configuration**:
`pnpm-workspace.yaml`:

```yaml
packages:
  - 'frontend'
  - 'backend'
  - 'shared'
```

**Migration from npm workspaces**:

- npm uses `package.json` `workspaces` field:
  ```json
  {
    "workspaces": ["frontend", "backend", "shared"]
  }
  ```
- pnpm requires separate `pnpm-workspace.yaml`
- Remove `workspaces` field from root package.json after migration

**Workspace commands**:

```bash
# Install all workspaces
pnpm install

# Run command in specific workspace
pnpm --filter frontend dev
pnpm --filter backend test

# Run command in all workspaces
pnpm -r build
pnpm -r test
```

**Alternatives Considered**:

- **Keep npm workspaces field**: Not supported by pnpm, would be ignored
- **Separate repositories**: Loses monorepo benefits, complicates shared code management

**Sources**:

- pnpm workspaces docs: https://pnpm.io/workspaces
- pnpm filtering: https://pnpm.io/filtering

### 6. Performance Monitoring

**Decision**: Use GitHub Actions job summaries with time measurement (from clarification session)

**Rationale**:

- **Zero cost**: Built-in GitHub Actions feature, no external services required
- **Immediate visibility**: Appears in PR checks and Actions UI
- **Historical tracking**: GitHub Actions run history provides time-series data
- **Simple implementation**: Bash time measurement with `$GITHUB_STEP_SUMMARY`

**Implementation**:

```yaml
- name: Install dependencies
  run: |
    START_TIME=$(date +%s)
    pnpm install --frozen-lockfile
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "### Dependency Installation Time" >> $GITHUB_STEP_SUMMARY
    echo "⏱️ Duration: ${DURATION}s" >> $GITHUB_STEP_SUMMARY
    echo "🎯 Target: <20s (cached), <45s (changed)" >> $GITHUB_STEP_SUMMARY
    if [ $DURATION -gt 45 ]; then
      echo "⚠️ WARNING: Installation time exceeded target" >> $GITHUB_STEP_SUMMARY
    fi
```

**Metrics to track**:

- Installation time (seconds)
- Cache hit/miss status
- Number of packages installed
- Total workspace count

**Alternatives Considered**:

- **External monitoring (DataDog, New Relic)**: Requires paid subscription, overkill for build metrics
- **CSV file in repo**: Merge conflicts, harder to visualize
- **GitHub issues**: Too noisy, not queryable

**Sources**:

- GitHub Actions job summaries: https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary

### 7. Compatibility Validation

**Decision**: Run full test suite and build before declaring migration successful

**Rationale**:

- **Zero regressions requirement**: SC-007 specifies 100% test pass rate with identical results
- **Script compatibility**: SC-006 requires all npm scripts work without modification
- **Build output validation**: Ensure build artifacts unchanged (hash comparison if needed)

**Validation checklist**:

```bash
# 1. Install with pnpm
pnpm install

# 2. Run all tests
pnpm test  # Should execute: pnpm -r test (all workspaces)

# 3. Lint check
pnpm run lint

# 4. Build all workspaces
pnpm run build

# 5. Verify script execution
pnpm run format
pnpm run check

# 6. Compare dependency versions
# (automated script comparing npm ls vs pnpm ls output)
```

**Scripts requiring validation**:

- `pnpm test` → `pnpm -r test` (all workspaces)
- `pnpm run build` → `pnpm -r --if-present build`
- `pnpm run lint` → Execute root-level ESLint
- `pnpm run format` → Execute root-level Prettier
- `pnpm run dev` → Start frontend dev server + Firebase emulators

**Potential issues**:

- **Phantom dependencies**: Code using packages not in package.json will break
  - Fix: Add missing dependencies explicitly
- **Peer dependency warnings**: pnpm stricter than npm
  - Fix: Install missing peers or configure `auto-install-peers=true`
- **Script path resolution**: Some scripts may assume npm-specific behavior
  - Fix: Update scripts to use workspace-relative paths

**Sources**:

- pnpm compatibility docs: https://pnpm.io/faq#what-does-pnpm-stand-for
- Strict peer dependencies: https://pnpm.io/npmrc#auto-install-peers

## Summary

All research questions resolved. Migration path is clear:

1. **Tool choice**: pnpm 8.x for performance and disk efficiency
2. **Migration method**: `pnpm import` for lockfile conversion with verification
3. **CI/CD caching**: `pnpm/action-setup@v2` + `actions/setup-node` cache
4. **Enforcement**: `.npmrc` engine-strict + package.json engines field
5. **Workspace config**: `pnpm-workspace.yaml` replacing npm workspaces
6. **Monitoring**: GitHub Actions job summaries for performance tracking
7. **Validation**: Full test suite + build verification before merge

No critical unknowns remaining. Ready to proceed to Phase 1 design.
