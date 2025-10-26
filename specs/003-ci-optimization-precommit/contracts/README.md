# API Contracts: CI/CD Optimization and Pre-commit Quality Checks

**Feature**: 003-ci-optimization-precommit
**Last Updated**: 2025-10-25

## Overview

This directory contains TypeScript interface definitions (contracts) for the APIs used by this feature. These contracts define:

1. **File Categorization API** - Categorize changed files to determine CI workflow steps
2. **Pre-commit Check API** - Run quality checks (Prettier, ESLint, TypeScript) and report results

## Contract Files

### file-categorization-api.ts

**Purpose**: Define interfaces for categorizing file changes and making workflow decisions

**Key Exports**:

- `FileCategory` enum - Documentation, source code, configuration, tests, other
- `FileChangeSet` interface - Categorized collection of changed files
- `WorkflowDecision` interface - Which CI steps to run
- `categorizeFiles()` - Main categorization function
- `determineWorkflowSteps()` - Derive CI decisions from categorization

**Used By**:

- GitHub Actions workflows (`.github/workflows/ci.yml`, `deploy.yml`)
- Utility script (`scripts/categorize-files.ts` or `.js`)

**Example Usage**:

```typescript
import { categorizeFiles, determineWorkflowSteps } from './contracts/file-categorization-api';

const changeSet = categorizeFiles(['README.md', 'docs/guide.md']);
const decision = determineWorkflowSteps(changeSet);

if (decision.isDocumentationOnly) {
  console.log('Skipping build and deployment for documentation-only changes');
}
```

---

### precommit-check-api.ts

**Purpose**: Define interfaces for running pre-commit quality checks

**Key Exports**:

- `CheckStatus` enum - Passed, failed, skipped
- `CheckResult` interface - Result of a single check (Prettier, ESLint, or TypeScript)
- `PrecommitCheckSummary` interface - Aggregate result of all checks
- `runPrecommitChecks()` - Main entry point for running all checks
- `getStagedFiles()` - Get staged files from git
- `formatCheckSummary()` - Format results for terminal display

**Used By**:

- `.husky/pre-commit` hook script
- CI workflows (for consistency validation)
- Manual check scripts (`pnpm run precommit`)

**Example Usage**:

```typescript
import { runPrecommitChecks, formatCheckSummary } from './contracts/precommit-check-api';

const stagedFiles = await getStagedFiles();
const summary = await runPrecommitChecks(stagedFiles);

console.log(formatCheckSummary(summary));

if (!summary.passed) {
  process.exit(1); // Block commit
}
```

---

## Implementation Requirements

### Type Safety

All implementations MUST:

- Use TypeScript for type safety
- Export functions matching the contract signatures exactly
- Throw errors for invalid inputs (empty arrays, absolute paths, etc.)
- Return promises for async operations

### Error Handling

Implementations MUST handle:

- Missing tools (Prettier, ESLint, TypeScript not installed)
- Timeout scenarios (checks taking too long)
- Invalid file paths (absolute paths, paths escaping repo root)
- Tool crashes (non-zero exit codes)

### Testing

Each contract implementation MUST have:

- Unit tests for all exported functions
- Integration tests for end-to-end workflows
- Edge case tests (empty input, invalid paths, tool failures)

### Performance

Implementations MUST meet:

- File categorization: <1 second for 1000 files
- Pre-commit checks: <60 seconds for typical commits (per SC-002)
- TypeScript compilation: <40 seconds (per research.md benchmarks)

---

## Validation Rules

### File Paths

- MUST be relative to repository root
- MUST use forward slashes (no backslashes)
- MUST NOT escape repository root (no `../../../etc/passwd`)
- MUST be non-empty arrays

### Check Results

- Exit code 0 MUST correspond to status "PASSED"
- Non-zero exit code MUST correspond to status "FAILED"
- Error count MUST be 0 if status is "PASSED"
- Duration MUST be non-negative

### Workflow Decisions

- If `runDeployment` is true, `runBuild` MUST also be true
- If `runBuild` is true, `runLinting` MUST also be true
- If `runTests` is true, `runLinting` MUST also be true

---

## Version History

| Version | Date       | Changes                                  |
| ------- | ---------- | ---------------------------------------- |
| 1.0.0   | 2025-10-25 | Initial contract definitions for Phase 1 |

---

## Related Documentation

- [Feature Specification](../spec.md) - High-level requirements
- [Data Model](../data-model.md) - Entity definitions and validation rules
- [Research](../research.md) - Technology choices and best practices
- [Implementation Plan](../plan.md) - Technical approach and architecture

---

## Notes

- These contracts are **specification documents**, not runnable code
- Actual implementations will be in `scripts/` directory at repository root
- TypeScript definitions may be extracted to `shared/types/` for reuse
- Breaking changes to these contracts require updating all consumers (hooks, workflows, scripts)
