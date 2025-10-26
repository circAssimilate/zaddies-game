# Data Model: CI/CD Optimization and Pre-commit Quality Checks

**Feature**: 003-ci-optimization-precommit
**Date**: 2025-10-25
**Status**: Phase 1 Design

## Overview

This feature is primarily tooling and workflow configuration with minimal data modeling needs. The "entities" from the specification represent runtime concepts (check results, file change sets) rather than persisted data structures.

## Entities

### FileChangeSet

**Description**: Represents a collection of file paths that have changed in a commit or push, categorized by type for decision-making.

**Attributes**:
- `files: string[]` - Array of file paths relative to repository root
- `categories: FileCategory[]` - Computed categorization of changed files

**Derived Properties**:
- `isDocumentationOnly: boolean` - True if all files match documentation patterns
- `hasSourceCode: boolean` - True if any file matches source code patterns
- `hasConfiguration: boolean` - True if any file matches configuration patterns
- `hasTests: boolean` - True if any file matches test patterns

**Validation Rules**:
- Files array must not be empty (cannot categorize zero files)
- All file paths must be relative, not absolute
- File paths must use forward slashes (normalize Windows paths)

**Usage**:
- Created in CI workflows to determine which steps to run
- Created in pre-commit hooks to determine which checks apply

**State Transitions**: N/A (immutable value object)

---

### FileCategory

**Description**: Enumeration of file type categories for workflow decisions.

**Values**:
- `DOCUMENTATION` - Markdown files, docs directory, README files
- `SOURCE_CODE` - TypeScript/JavaScript source files in src/ directories
- `CONFIGURATION` - package.json, tsconfig.json, workflow files, etc.
- `TESTS` - Test files and test directories
- `OTHER` - Catch-all for unrecognized patterns

**Usage**: Determines which CI workflow steps execute and which pre-commit checks run

---

### CheckResult

**Description**: Outcome of a single validation check (Prettier, ESLint, TypeScript compiler).

**Attributes**:
- `checkName: string` - Name of the check (e.g., "prettier", "eslint", "typescript")
- `status: CheckStatus` - Pass, fail, or skipped
- `exitCode: number` - Process exit code (0 = success, non-zero = failure)
- `duration: number` - Execution time in milliseconds
- `output: string` - stdout/stderr from the check command
- `errorCount: number` - Number of errors found (0 if passed)
- `timestamp: Date` - When the check completed

**Validation Rules**:
- Exit code 0 must correspond to status "passed"
- Non-zero exit code must correspond to status "failed"
- Error count must be 0 if status is "passed"
- Duration must be non-negative

**Relationships**:
- Part of PrecommitCheckSummary (multiple CheckResults)

**State Transitions**: N/A (created once per check execution)

---

### CheckStatus

**Description**: Enumeration of check execution statuses.

**Values**:
- `PASSED` - Check completed successfully with no errors
- `FAILED` - Check completed but found errors
- `SKIPPED` - Check was not run (e.g., no relevant files changed)

---

### PrecommitCheckSummary

**Description**: Aggregate result of all pre-commit checks for a single commit attempt.

**Attributes**:
- `commitHash: string | null` - Git commit hash (null if commit was blocked)
- `results: CheckResult[]` - Individual check results
- `totalDuration: number` - Total time for all checks in milliseconds
- `overallStatus: CheckStatus` - Aggregate status (failed if any check failed)
- `filesChecked: number` - Count of files that were checked

**Derived Properties**:
- `passed: boolean` - True if overallStatus is PASSED
- `shouldBlockCommit: boolean` - True if any check failed

**Validation Rules**:
- Overall status is FAILED if any result has FAILED status
- Overall status is PASSED only if all results are PASSED or SKIPPED
- Total duration should approximately equal sum of individual durations

**Usage**: Logged to terminal output during git commit attempt

**State Transitions**: N/A (created once per commit attempt)

---

### WorkflowDecision

**Description**: Represents the decision about which CI workflow steps to execute based on file changes.

**Attributes**:
- `runLinting: boolean` - Whether to run Prettier and ESLint checks
- `runTests: boolean` - Whether to run test suites
- `runBuild: boolean` - Whether to run frontend and backend builds
- `runDeployment: boolean` - Whether to deploy to Firebase
- `reason: string` - Human-readable explanation of the decision

**Validation Rules**:
- If runDeployment is true, runBuild must also be true (can't deploy without building)
- If runBuild is true, runLinting must also be true (maintain quality gates)
- If runTests is true, runLinting must also be true (maintain quality gates)

**Decision Logic**:
```
IF all files are DOCUMENTATION:
  runLinting = true (markdown linting)
  runTests = false
  runBuild = false
  runDeployment = false

ELSE IF any file is CONFIGURATION:
  runLinting = true
  runTests = true
  runBuild = true
  runDeployment = true (full pipeline for safety)

ELSE IF any file is SOURCE_CODE:
  runLinting = true
  runTests = true
  runBuild = true
  runDeployment = true (full pipeline)

ELSE IF all non-documentation files are TESTS:
  runLinting = true
  runTests = true
  runBuild = false
  runDeployment = false
```

**Usage**: Created in GitHub Actions workflow to set conditional step execution

---

## Configuration Structures

### lint-staged Configuration

**File**: `.lintstagedrc.json` or package.json section

**Structure**:
```typescript
type LintStagedConfig = {
  "*.{ts,tsx,js,jsx}": string[];  // Commands to run on TypeScript/JavaScript files
  "*.md": string[];                // Commands to run on Markdown files (optional)
};
```

**Example**:
```json
{
  "*.{ts,tsx,js,jsx}": [
    "prettier --write",
    "eslint --fix"
  ]
}
```

**Validation**: Commands must be executable from package.json scripts or node_modules/.bin

---

### Husky Hook Configuration

**File**: `.husky/pre-commit`

**Structure**: Shell script that runs commands

**Example**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec lint-staged && pnpm run type-check
```

**Validation**: Must be executable (chmod +x), must exit non-zero on failure

---

### File Pattern Configuration

**File**: `scripts/categorize-files.js` or embedded in GitHub Actions

**Structure**:
```typescript
type FilePatterns = {
  documentation: string[];   // Glob patterns for documentation files
  sourceCode: string[];      // Glob patterns for source code
  configuration: string[];   // Glob patterns for configuration files
  tests: string[];           // Glob patterns for test files
};
```

**Example**:
```javascript
const patterns = {
  documentation: [
    "**/*.md",
    "docs/**/*",
    ".github/ISSUE_TEMPLATE/**",
    ".github/PULL_REQUEST_TEMPLATE/**"
  ],
  sourceCode: [
    "frontend/src/**/*.{ts,tsx,js,jsx}",
    "backend/src/**/*.{ts,tsx,js,jsx}",
    "shared/src/**/*.{ts,tsx,js,jsx}"
  ],
  configuration: [
    "package.json",
    "pnpm-lock.yaml",
    "tsconfig*.json",
    ".eslintrc.json",
    ".github/workflows/**"
  ],
  tests: [
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    "**/tests/**",
    "**/__tests__/**"
  ]
};
```

**Validation**: Patterns must be valid glob syntax, must have no overlapping patterns (each file matches at most one category)

---

## Non-Persisted Data

**Important**: This feature does NOT persist data to databases or files. All entities are runtime-only:

- **FileChangeSet**: Created from git diff, exists only during CI run or commit attempt
- **CheckResult**: Logged to stdout/stderr, not saved
- **PrecommitCheckSummary**: Displayed in terminal, not persisted
- **WorkflowDecision**: Made dynamically in GitHub Actions, not stored

**Logging**: Check results are logged to CI workflow output and terminal but are not structured logs (no observability platform integration needed for this feature).

---

## Relationships

```
PrecommitCheckSummary
  │
  └── contains multiple ──> CheckResult
                               │
                               └── has enum ──> CheckStatus

FileChangeSet
  │
  └── categorized into ──> FileCategory (enum)
  │
  └── determines ──> WorkflowDecision
```

---

## Data Validation Summary

| Entity                   | Key Validation                                    |
| ------------------------ | ------------------------------------------------- |
| FileChangeSet            | Non-empty array, relative paths, forward slashes  |
| CheckResult              | Exit code matches status, duration >= 0           |
| PrecommitCheckSummary    | Overall status derived correctly from results     |
| WorkflowDecision         | Dependency chain (deploy → build → lint)          |
| File Pattern Config      | Valid glob syntax, no overlapping categories      |

---

## Implementation Notes

1. **TypeScript Types**: All entities should be defined as TypeScript interfaces/types for type safety
2. **Immutability**: Treat all entities as immutable value objects (no setters)
3. **Testing**: Unit tests should validate categorization logic and decision rules
4. **Error Handling**: Invalid data (empty file list, negative duration) should throw errors early

---

**Next**: Proceed to contracts/ generation (API contracts for any scripting interfaces)
