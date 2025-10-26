/**
 * Pre-commit Check Types
 *
 * Type definitions for running pre-commit quality checks
 * (Prettier, ESLint, TypeScript compiler) and reporting results.
 */

/**
 * Status of a check execution
 */
export enum CheckStatus {
  /** Check completed successfully with no errors */
  PASSED = 'PASSED',

  /** Check completed but found errors */
  FAILED = 'FAILED',

  /** Check was not run (e.g., no relevant files changed) */
  SKIPPED = 'SKIPPED',
}

/**
 * Result of a single validation check
 */
export interface CheckResult {
  /** Name of the check (e.g., "prettier", "eslint", "typescript") */
  checkName: string;

  /** Pass, fail, or skipped */
  status: CheckStatus;

  /** Process exit code (0 = success, non-zero = failure) */
  exitCode: number;

  /** Execution time in milliseconds */
  duration: number;

  /** stdout/stderr from the check command */
  output: string;

  /** Number of errors found (0 if passed) */
  errorCount: number;

  /** When the check completed */
  timestamp: Date;
}

/**
 * Aggregate result of all pre-commit checks
 */
export interface PrecommitCheckSummary {
  /** Git commit hash (null if commit was blocked) */
  commitHash: string | null;

  /** Individual check results */
  results: CheckResult[];

  /** Total time for all checks in milliseconds */
  totalDuration: number;

  /** Aggregate status (failed if any check failed) */
  overallStatus: CheckStatus;

  /** Count of files that were checked */
  filesChecked: number;

  /** True if all checks passed */
  readonly passed: boolean;

  /** True if commit should be blocked */
  readonly shouldBlockCommit: boolean;
}

/**
 * Configuration for running pre-commit checks
 */
export interface PrecommitCheckConfig {
  /** Run Prettier formatting (always true unless explicitly disabled) */
  runPrettier: boolean;

  /** Run ESLint linting */
  runESLint: boolean;

  /** Run TypeScript compiler type checking */
  runTypeScript: boolean;

  /** Maximum allowed duration for all checks in milliseconds (default: 60000) */
  timeout: number;

  /** Whether to auto-fix formatting and linting issues (default: true for pre-commit) */
  autoFix: boolean;
}
