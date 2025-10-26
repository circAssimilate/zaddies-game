# Implementation Plan: Package Manager Migration to pnpm

**Branch**: `002-migrate-to-pnpm` | **Date**: 2025-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-migrate-to-pnpm/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.claude/commands/speckit.plan.md` for the execution workflow.

## Summary

Migrate the zaddies-game project from npm to pnpm as the package manager to achieve 50%+ reduction in CI/CD dependency installation time. The migration will update all package.json files, GitHub Actions workflows, documentation, and developer setup instructions to use pnpm. Performance improvements target: CI builds <20s (cached), <45s (lockfile changes); deployment <30s (uncached), <15s (cached); local dev <30s first install. The migration is permanent with no rollback plan.

**Technical Approach**: Use pnpm's `import` command to convert package-lock.json to pnpm-lock.yaml, configure GitHub Actions with `pnpm/action-setup@v2` and caching via `actions/setup-node`, enforce pnpm-only usage through `.npmrc` with `engine-strict=true`, update all workspace package.json scripts, validate zero dependency version changes, and measure performance metrics in GitHub Actions job summaries.

## Technical Context

**Language/Version**: TypeScript 5.3+ (frontend/backend), Node.js 20 LTS, pnpm 8.x
**Primary Dependencies**:

- Package Manager: pnpm 8.x (migration target from npm 10.x)
- CI/CD: GitHub Actions (actions/setup-node@v3, pnpm/action-setup@v2)
- Build Tools: Vite 5.x, TypeScript compiler, Vitest 1.x
- Workspace Management: pnpm workspaces (replacing npm workspaces)

**Storage**: Filesystem (lockfiles, node_modules, pnpm store cache)
**Testing**: Vitest for existing test suites (no changes), manual validation of installation times
**Target Platform**: Development (macOS/Linux/Windows), CI/CD (GitHub Actions Ubuntu runners), Deployment (Firebase/Cloud hosting)
**Project Type**: Web application monorepo (frontend + backend + shared workspaces)
**Performance Goals**:

- CI cached install: <20s (from ~60s npm)
- CI uncached/changed: <45s (from ~90s npm)
- Deployment cached: <15s
- Deployment uncached: <30s
- Local dev first install: <30s
- Cache hit rate: >80%

**Constraints**:

- Zero dependency version changes during migration (lockfile equivalence)
- All existing tests must pass identically
- All existing scripts must work without modification
- Permanent migration (no rollback mechanism)
- GitHub Actions runner disk space: 500MB-1GB for pnpm cache

**Scale/Scope**:

- 3 workspaces (frontend, backend, shared)
- ~50-100 direct dependencies across workspaces
- GitHub Actions: 2 workflows (CI, Deploy)
- Documentation: 4 files (README, specs/001-texas-holdem-poker/quickstart.md, CI workflows, CLAUDE.md)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Test-Driven Development (TDD) ✅ PASS

- **Status**: COMPLIANT
- **Evidence**: Migration validation tests defined in spec (SC-001 through SC-012)
- **Gates**:
  - ✅ Tests defined: Performance benchmarks, lockfile equivalence validation, script compatibility tests
  - ✅ Success criteria measurable: Installation time targets, cache hit rates, zero version changes
  - ✅ Test environment: CI/CD pipelines provide automated validation, local testing for developer workflows
  - ⚠️ TDD applicability: Infrastructure migration - tests are validation scripts rather than unit tests, but success criteria are pre-defined and measurable

**Note**: While this is an infrastructure migration rather than feature development, validation criteria are defined upfront and will be verified before declaring success.

### II. Modular Architecture ✅ PASS

- **Status**: COMPLIANT
- **Evidence**: Migration affects package manager tooling only, existing modular architecture unchanged
- **Modules**:
  - Package manager configuration (`.npmrc`, `package.json` engines, pnpm-workspace.yaml) - isolated config change
  - CI/CD workflows (`.github/workflows/*`) - independent pipeline configuration
  - Documentation (`README.md`, `quickstart.md`, etc.) - isolated documentation updates
  - Existing code modules (frontend, backend, shared) - no changes required
- **Gates**:
  - ✅ Single responsibility: Each component (config, CI, docs) has clear purpose
  - ✅ Well-defined interfaces: pnpm CLI commands, GitHub Actions workflow syntax
  - ✅ Minimal coupling: Package manager swap affects tooling only, not application code
  - ✅ Independent testing: Can validate each component (install speed, script execution, doc accuracy) separately

### III. Performance-First ✅ PASS

- **Status**: COMPLIANT
- **Evidence**: Performance improvement is the primary goal with specific targets
- **Benchmarks**:
  - ✅ CI cached install: <20s (measured via GitHub Actions timing)
  - ✅ CI uncached/lockfile changes: <45s (measured via GitHub Actions timing)
  - ✅ Deployment cached: <15s (measured via GitHub Actions timing)
  - ✅ Deployment uncached: <30s (measured via GitHub Actions timing)
  - ✅ Local dev: <30s first install (manual developer validation)
  - ✅ Performance improvement validation: FR-013 requires 50%+ reduction verification
- **Gates**:
  - ✅ Performance tests in migration: Timing instrumentation in GitHub Actions workflows
  - ✅ Benchmarks automated: GitHub Actions job summaries report installation time (FR-004)
  - ✅ Regression prevention: Migration will not proceed if performance targets not met
  - ✅ Profiling: Before/after timing comparison, cache hit rate monitoring (SC-011)

### IV. Client-Server Separation ✅ PASS (N/A)

- **Status**: NOT APPLICABLE
- **Evidence**: This is a build tooling migration, not an application feature
- **Rationale**: Package manager changes affect development and CI/CD infrastructure only. No client-server communication patterns are modified. Frontend and backend remain separate with existing API contracts unchanged.

### V. Observability & Debuggability ✅ PASS

- **Status**: COMPLIANT
- **Evidence**: Migration includes performance monitoring and error handling
- **Requirements Met**:
  - ✅ Structured Logging: GitHub Actions job summaries log installation time (FR-004)
  - ✅ Metrics Collection: Installation time, cache hit rates tracked (SC-001 through SC-012)
  - ✅ Error Reporting: FR-012 requires fast failure with clear error messaging for pnpm installation failures
  - ✅ Debug Interfaces: GitHub Actions logs provide detailed output, `.npmrc` provides graceful errors for wrong package manager usage (FR-008)
  - ✅ Cost Conscious: No paid subscriptions required - uses built-in GitHub Actions features only
- **Prohibited Compliance**:
  - ✅ No paid tools: Using only GitHub Actions built-in features
  - ✅ No silent failures: FR-012 explicit error messaging requirement
  - ✅ No PII logging: Package manager metrics are non-sensitive
  - ✅ Performance impact considered: Timing measurements are lightweight, no production logging overhead

## Project Structure

### Documentation (this feature)

```text
specs/002-migrate-to-pnpm/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (pnpm features, migration strategies, caching best practices)
├── data-model.md        # Phase 1 output (lockfile structure, config schema)
├── quickstart.md        # Phase 1 output (developer setup with pnpm)
├── contracts/           # Phase 1 output (GitHub Actions workflow contracts, package.json schema)
│   ├── github-actions.md    # CI/CD workflow changes
│   └── package-config.md    # package.json and .npmrc structure
├── checklists/          # Created during /speckit.specify
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application monorepo (existing structure, modified for pnpm)

# Root configuration (modified files marked with *)
package.json *           # Add engines field, update scripts for pnpm
package-lock.json        # DELETE after migration
pnpm-lock.yaml *         # NEW: Generated via pnpm import
pnpm-workspace.yaml *    # NEW: Workspace configuration (replacing npm workspaces in package.json)
.npmrc *                 # NEW/MODIFIED: Add engine-strict=true, shamefully-hoist settings
.gitignore               # Already excludes node_modules, may need .pnpm-store exclusion
README.md *              # Update installation instructions

# CI/CD configuration (modified)
.github/
└── workflows/
    ├── ci.yml *         # Update to use pnpm/action-setup, pnpm install --frozen-lockfile
    └── deploy.yml *     # Update to use pnpm/action-setup, pnpm install --frozen-lockfile

# Backend workspace (configuration only)
backend/
├── package.json *       # Add engines field if not inheriting from root
└── (source code unchanged)

# Frontend workspace (configuration only)
frontend/
├── package.json *       # Add engines field if not inheriting from root
└── (source code unchanged)

# Shared workspace (configuration only)
shared/
├── package.json *       # Add engines field if not inheriting from root
└── (source code unchanged)

# Specification documentation (modified)
specs/
└── 001-texas-holdem-poker/
    ├── quickstart.md *      # Update npm commands to pnpm
    ├── contracts/
    │   └── api-functions.md *  # Update npm ci examples to pnpm install
    └── (other specs unchanged)

# Project documentation (modified)
CLAUDE.md *              # Update command: npm test → pnpm test
```

**Structure Decision**: This is a web application monorepo using the existing structure with pnpm workspace configuration replacing npm workspaces. The migration primarily affects configuration files (package.json, lockfiles, .npmrc, CI workflows) and documentation. No source code directory structure changes are required. The pnpm-workspace.yaml file will define the three workspaces (frontend, backend, shared) that currently use npm workspaces via the root package.json "workspaces" field.

## Complexity Tracking

> **No constitution violations - this section is empty**

All five core principles are satisfied without exceptions. This is a straightforward infrastructure migration with pre-defined success criteria, modular configuration changes, performance-first objectives, no client-server architecture impact, and built-in observability through GitHub Actions logging.
