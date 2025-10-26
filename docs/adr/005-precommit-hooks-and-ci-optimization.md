# ADR 005: Use Husky + lint-staged for Pre-commit Hooks and CI Optimization

## Status

Accepted

## Context

The Zaddies Game project needs to reduce failed CI builds caused by formatting, linting, and type errors. Currently, developers push code that fails basic quality checks, leading to wasted CI resources and slower feedback loops. The team identified two main problems:

1. **Quality Issues Reach CI**: Formatting, linting, and TypeScript errors are not caught locally before commits, causing CI failures that could have been prevented
2. **CI Runs Unnecessarily**: Documentation-only changes trigger full build and deployment pipelines, wasting time and resources

The project is a pnpm monorepo with TypeScript, using Prettier for formatting, ESLint for linting, and the TypeScript compiler for type checking. The CI/CD system runs on GitHub Actions. The team needs a solution that:

- Works cross-platform (macOS, Linux, Windows)
- Installs automatically without manual developer setup
- Runs quality checks on staged files only (performance)
- Integrates seamlessly with existing pnpm workspace structure
- Allows emergency bypasses when needed
- Optimizes CI workflows based on changed file types

## Decision

We will implement two complementary optimizations:

### 1. Pre-commit Quality Gates

Use **Husky 8.x** and **lint-staged 15.x** to run automated quality checks before commits:

- **Husky**: Manages git hooks, installed automatically via `prepare` script in package.json
- **lint-staged**: Runs commands only on staged files for performance
- **Check sequence**: Run checks sequentially in order: Prettier → ESLint → TypeScript
  - Prettier formats files automatically (fast, deterministic)
  - ESLint runs after formatting to avoid false positives (staged files only)
  - TypeScript compiler type-checks entire project (necessary for cross-file type validation)

Configuration approach:

- Add `prepare` script to package.json: `"prepare": "husky install"`
- Configure lint-staged in package.json with file-pattern-based commands
- Create `.husky/pre-commit` hook that calls lint-staged and TypeScript compiler
- Developers can bypass with `git commit --no-verify` for emergencies

### 2. Intelligent CI Workflow Optimization

Use **GitHub Actions conditional steps** with file change detection to skip unnecessary workflow steps:

- Categorize changed files into: Documentation, Source Code, Configuration, Tests
- Use conditional `if` expressions in workflow steps (not `paths-ignore` filters)
- Skip build and deployment for documentation-only changes
- Skip deployment for test-only changes
- Always run full pipeline for source code or configuration changes
- Log workflow decisions for observability

Implementation approach:

- Create `scripts/categorize-files.ts` utility for file categorization logic
- Add file change detection step at start of CI workflows
- Apply conditional logic to expensive steps (build, deployment)
- Maintain quality gates (linting always runs)

## Consequences

### Positive

- **Automatic Setup**: Husky installs via `prepare` script - no manual developer action needed
- **Performance**: lint-staged runs checks only on staged files, typical pre-commit time 10-45 seconds
- **Industry Standard**: Husky has 7M+ weekly npm downloads, well-documented, widely adopted
- **Cross-Platform**: Works on macOS, Linux, and Windows (via Git Bash on Windows)
- **Staged-File Optimization**: lint-staged filters commands to only affected files out of the box
- **Team Familiarity**: JavaScript ecosystem standard, team already familiar with similar tools
- **CI Resource Savings**: Documentation-only changes skip deployment, estimated 30% CI time reduction
- **Better Observability**: Conditional steps allow logging which steps were skipped and why
- **Granular Control**: Conditional steps more flexible than path filters (can run some checks, skip others)

### Negative

- **Two Dependencies**: Requires both Husky and lint-staged (vs. simple-git-hooks which is one package)
- **Prepare Script Required**: Must configure prepare script in package.json (but this is standard practice)
- **Sequential Checks**: Running checks in sequence rather than parallel (but Prettier is fast, TypeScript dominates execution time)
- **TypeScript Performance**: Type-checking entire project can be slow (10-30s), but necessary for correctness

### Neutral

- **Bypass Available**: Developers can use `--no-verify` flag to skip hooks in emergencies (documented in quickstart)
- **No Python Dependency**: Unlike pre-commit framework, stays within JavaScript ecosystem
- **Windows Compatibility**: Relies on Git Bash being available on Windows (standard with Git installation)

## Alternatives Considered

### simple-git-hooks

**Rejected because**: No built-in support for running on staged files only. Would require custom scripting to match lint-staged functionality. While simpler (one dependency), the developer experience and performance benefits of lint-staged justify the extra dependency.

### pre-commit framework (Python-based)

**Rejected because**: Requires Python installation (extra language dependency). Not JavaScript-native, so team would be less familiar. Overkill for our straightforward use case.

### GitHub Actions `paths-ignore` filters

**Rejected because**: All-or-nothing approach (entire workflow skips or runs). Cannot run some checks (like markdown linting) while skipping others (build/deploy). Conditional steps provide more granular control and better observability.

### Parallel check execution

**Rejected because**: Prettier auto-formatting would create conflicts with ESLint if run in parallel. No performance benefit since Prettier is fast and TypeScript dominates execution time. Sequential execution with fast-fail provides faster feedback for common issues.

## Implementation Notes

- ADR created: 2025-10-25
- Feature branch: `003-ci-optimization-precommit`
- Related documentation:
  - Feature spec: `specs/003-ci-optimization-precommit/spec.md`
  - Research: `specs/003-ci-optimization-precommit/research.md`
  - Implementation plan: `specs/003-ci-optimization-precommit/plan.md`
  - Tasks: `specs/003-ci-optimization-precommit/tasks.md`

## References

- Husky documentation: https://typicode.github.io/husky/
- lint-staged documentation: https://github.com/lint-staged/lint-staged
- ADR template: Michael Nygard format (http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions)
