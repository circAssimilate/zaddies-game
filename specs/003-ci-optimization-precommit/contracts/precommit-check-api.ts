/**
 * Pre-commit Check API Contract
 *
 * Defines the interface for running pre-commit quality checks
 * (Prettier, ESLint, TypeScript compiler) and reporting results.
 *
 * Used by: .husky/pre-commit hook, CI workflows
 * Implementation: scripts/run-precommit-checks.js (or .ts)
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

/**
 * Main API: Run all pre-commit checks
 *
 * Executes checks in sequence: Prettier → ESLint → TypeScript
 * Stops execution on first failure (fast-fail)
 *
 * @param stagedFiles - Array of staged file paths (from git diff --cached --name-only)
 * @param config - Check configuration (uses defaults if not provided)
 * @returns Summary of all check results
 * @throws Error if timeout exceeded or catastrophic failure (e.g., tool not installed)
 */
export function runPrecommitChecks(
  stagedFiles: string[],
  config?: Partial<PrecommitCheckConfig>
): Promise<PrecommitCheckSummary>;

/**
 * Run Prettier formatting check/fix
 *
 * @param files - Files to format (filtered to supported extensions)
 * @param autoFix - If true, write formatted files; if false, only check
 * @returns Check result
 */
export function runPrettier(files: string[], autoFix: boolean): Promise<CheckResult>;

/**
 * Run ESLint linting check/fix
 *
 * @param files - Files to lint (filtered to .ts, .tsx, .js, .jsx)
 * @param autoFix - If true, apply auto-fixable rules; if false, only report
 * @returns Check result
 */
export function runESLint(files: string[], autoFix: boolean): Promise<CheckResult>;

/**
 * Run TypeScript compiler type checking
 *
 * Note: Always runs on entire project (not just changed files)
 * because TypeScript needs full project context for type checking.
 *
 * @returns Check result
 */
export function runTypeScriptCheck(): Promise<CheckResult>;

/**
 * Get staged files from git
 *
 * @returns Array of staged file paths relative to repository root
 */
export function getStagedFiles(): Promise<string[]>;

/**
 * Format check summary for terminal output
 *
 * @param summary - Check summary to format
 * @returns Formatted multi-line string with colors/emoji for terminal display
 */
export function formatCheckSummary(summary: PrecommitCheckSummary): string;

/**
 * Get default pre-commit check configuration
 *
 * @returns Default config (all checks enabled, 60s timeout, auto-fix enabled)
 */
export function getDefaultConfig(): PrecommitCheckConfig;
