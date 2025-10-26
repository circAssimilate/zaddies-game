# Research: CI/CD Optimization and Pre-commit Quality Checks

**Feature**: 003-ci-optimization-precommit
**Date**: 2025-10-25
**Status**: Phase 0 Complete

## Research Objectives

This research resolves the "NEEDS CLARIFICATION" item from Technical Context and establishes best practices for:

1. Git hook framework selection (Husky vs lint-staged vs simple-git-hooks)
2. File categorization patterns for CI workflow optimization
3. Pre-commit check sequencing and performance optimization

## Decision 1: Git Hook Framework Selection

### Context

Need to select a git hook framework that:

- Works cross-platform (macOS, Linux, Windows)
- Installs automatically via npm scripts
- Has minimal configuration overhead
- Supports running commands on staged files only
- Has active maintenance and community support

### Options Evaluated

#### Option A: Husky + lint-staged

**Pros**:

- Most popular solution (7M+ weekly npm downloads for husky)
- Mature and battle-tested
- Excellent integration with lint-staged for running commands on staged files only
- Great documentation and community support
- Works well with pnpm workspaces

**Cons**:

- Two dependencies instead of one (husky + lint-staged)
- Slightly more configuration (two config files/sections)
- Husky v8+ requires explicit installation step in package.json prepare script

**Performance**: Excellent - lint-staged only runs checks on staged files

#### Option B: simple-git-hooks

**Pros**:

- Minimal and lightweight (zero dependencies)
- Simple configuration (single package.json section)
- Works with pnpm

**Cons**:

- No built-in support for running on staged files only (would need custom scripting)
- Less popular than Husky (~300K weekly downloads)
- Less community support and examples

**Performance**: Good if manually implemented, but requires custom scripting

#### Option C: Pre-commit framework (Python-based)

**Pros**:

- Language-agnostic
- Very powerful plugin system

**Cons**:

- Requires Python installation (extra dependency)
- Not JavaScript-native (team may be less familiar)
- Overkill for our simple use case

### Decision

**CHOSEN: Husky + lint-staged**

**Rationale**:

1. Industry standard with proven track record
2. lint-staged provides critical "staged files only" filtering out of the box
3. Excellent pnpm support and monorepo compatibility
4. Team familiarity (widely used in JavaScript ecosystem)
5. Automatic installation via pnpm install when prepare script is configured

**Alternatives Considered**:

- simple-git-hooks rejected: Would require custom scripting to match lint-staged functionality
- pre-commit framework rejected: Adds Python dependency and unnecessary complexity

**Trade-offs Accepted**:

- Two dependencies instead of one (acceptable for better DX)
- Requires prepare script in package.json (standard practice)

## Decision 2: File Categorization Strategy for CI

### Context

Need to define which file patterns should trigger which CI workflow steps. Goals:

- Skip build/deployment for documentation-only changes
- Maintain safety (don't skip critical checks)
- Be explicit and maintainable

### File Categories Defined

#### Category 1: Documentation Only (Skip Build/Deploy)

**Patterns**:

```
**/*.md
docs/**/*
README.md
CHANGELOG.md
CONTRIBUTING.md
.github/ISSUE_TEMPLATE/**
.github/PULL_REQUEST_TEMPLATE/**
```

**CI Behavior**: Run linting (markdown linting if configured), skip build, skip deployment

**Rationale**: Documentation changes have zero runtime impact and don't require compilation or deployment

#### Category 2: Configuration (Run Full Pipeline)

**Patterns**:

```
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig*.json
.eslintrc.json
.prettierrc
firebase.json
.firebaserc
.github/workflows/**
```

**CI Behavior**: Run ALL steps (linting, testing, building, deployment)

**Rationale**: Configuration changes can affect build behavior, so skip nothing for safety

#### Category 3: Source Code (Run Full Pipeline)

**Patterns**:

```
frontend/src/**
backend/src/**
shared/src/**
**/*.ts
**/*.tsx
**/*.js
**/*.jsx
```

**CI Behavior**: Run ALL steps

**Rationale**: Source code changes require compilation, testing, and deployment

#### Category 4: Tests Only (Run Tests, Skip Deployment)

**Patterns**:

```
**/*.test.ts
**/*.test.tsx
**/*.spec.ts
**/*.spec.tsx
**/tests/**
**/__tests__/**
```

**CI Behavior**: Run linting and tests, skip deployment (tests themselves don't need deploying)

**Rationale**: Test-only changes validate existing code but don't require deployment

### GitHub Actions Implementation Pattern

Use `paths` filter with negation:

```yaml
on:
  push:
    branches: [main]
    paths-ignore:
      - '**/*.md'
      - 'docs/**'
      # (documentation patterns)
```

**Alternative**: Use conditional job steps with `if` expressions checking changed files

**Decision**: Use **conditional job steps** instead of `paths-ignore` for more granular control

**Rationale**:

- paths-ignore is all-or-nothing (entire workflow skips or runs)
- Conditional steps allow running some checks (like markdown linting) while skipping others (build/deploy)
- Better observability (can log which steps were skipped and why)

## Decision 3: Pre-commit Check Sequencing

### Context

Need to determine optimal order for running Prettier, ESLint, and TypeScript compiler in pre-commit hook.

### Sequence Chosen

**Order**:

1. **Prettier** (auto-format)
2. **ESLint** (lint)
3. **TypeScript Compiler** (type-check)

**Rationale**:

1. **Prettier First**: Auto-formatting fixes most style issues before linting runs, reducing false positives from ESLint style rules. Prettier is fast and deterministic.

2. **ESLint Second**: Runs after formatting is clean. Catches code quality issues, best practices violations, and some logic errors. Faster than full TypeScript compilation.

3. **TypeScript Last**: Most expensive check. Only runs if formatting and linting pass. Catches type errors across entire project.

**Performance Optimization**:

- lint-staged runs Prettier and ESLint only on staged files (fast)
- TypeScript compiler runs on entire project (necessary for type checking cross-file references)
- Expected total time: 10-30 seconds for typical commit

### Alternative Considered

**Parallel Execution**: Run all three simultaneously

**Rejected Because**:

- Prettier auto-formatting would create conflicts with ESLint if run in parallel
- No performance benefit (Prettier is fast, TypeScript dominates execution time)
- Sequential execution with fast-fail provides faster feedback for common issues

## Performance Benchmarks

Based on current codebase (~5,000 LOC):

| Check                   | Scope        | Expected Time | Limit |
| ----------------------- | ------------ | ------------- | ----- |
| Prettier                | Staged files | 1-5 seconds   | 10s   |
| ESLint                  | Staged files | 2-10 seconds  | 20s   |
| TypeScript (full build) | Entire repo  | 10-30 seconds | 40s   |
| **Total (typical)**     | -            | 13-45 seconds | 60s   |

**Escape Hatch**: Developers can use `git commit --no-verify` to bypass hooks in emergencies (FR-014)

## Implementation Best Practices

### Cross-Platform Compatibility

**Considerations**:

- Use pnpm scripts for all commands (works on macOS, Linux, Windows)
- Husky uses sh scripts - works natively on macOS/Linux, uses Git Bash on Windows
- Avoid platform-specific shell commands (test on Windows if possible)

### Installation Automation

**Approach**:

```json
{
  "scripts": {
    "prepare": "husky install",
    "precommit": "lint-staged && pnpm run type-check"
  }
}
```

**Behavior**:

- `prepare` runs automatically after `pnpm install`
- Husky hooks install without manual developer action
- New developers get hooks automatically on first checkout

### Error Handling

**Requirements**:

- Clear error messages indicating which check failed
- Show exact file and line number for errors
- Provide suggestion for how to fix (or use --no-verify to bypass)
- Non-zero exit code blocks commit

## ADR Requirements

Based on Constitution Principle VIII, the following ADR must be created:

**ADR 005: Git Hook Framework and CI Optimization Strategy**

**Required Sections**:

1. **Title**: "ADR 005: Use Husky + lint-staged for Pre-commit Hooks"
2. **Status**: "accepted"
3. **Context**: Team needs to catch code quality issues before CI runs, reduce failed builds, and optimize CI resource usage for a pnpm monorepo with TypeScript, Prettier, and ESLint.
4. **Decision**:
   - Use Husky 8.x + lint-staged for git hooks
   - Run Prettier → ESLint → TypeScript sequentially
   - Use GitHub Actions conditional steps for file-based workflow optimization
5. **Consequences**:
   - **Positive**: Automatic installation, staged-file optimization, cross-platform support, industry-standard tooling
   - **Negative**: Two dependencies instead of one, requires prepare script
   - **Neutral**: Developers can bypass with --no-verify flag

**Action**: Create ADR 005 before implementation phase begins

## Research Summary

All "NEEDS CLARIFICATION" items resolved:

✅ **Git Hook Framework**: Husky 8.x + lint-staged
✅ **File Categorization**: Four categories defined with explicit patterns
✅ **Check Sequencing**: Prettier → ESLint → TypeScript (sequential)
✅ **Performance Strategy**: lint-staged for targeted checks, full tsc for type safety
✅ **ADR Requirement**: ADR 005 specification documented above

**Next Phase**: Proceed to Phase 1 (Design & Contracts)
