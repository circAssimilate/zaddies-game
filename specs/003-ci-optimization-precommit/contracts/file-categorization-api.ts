/**
 * File Categorization API Contract
 *
 * Defines the interface for categorizing changed files to determine
 * which CI workflow steps should execute.
 *
 * Used by: GitHub Actions workflows, pre-commit hooks
 * Implementation: scripts/categorize-files.js (or .ts)
 */

/**
 * Category classification for changed files
 */
export enum FileCategory {
  /** Markdown files, docs directory, README files */
  DOCUMENTATION = 'DOCUMENTATION',

  /** TypeScript/JavaScript source files in src/ directories */
  SOURCE_CODE = 'SOURCE_CODE',

  /** package.json, tsconfig.json, workflow files, etc. */
  CONFIGURATION = 'CONFIGURATION',

  /** Test files and test directories */
  TESTS = 'TESTS',

  /** Catch-all for unrecognized patterns */
  OTHER = 'OTHER',
}

/**
 * Result of categorizing a set of changed files
 */
export interface FileChangeSet {
  /** Array of file paths relative to repository root */
  files: string[];

  /** Categorization of each file */
  categories: FileCategory[];

  /** True if all files match documentation patterns */
  readonly isDocumentationOnly: boolean;

  /** True if any file matches source code patterns */
  readonly hasSourceCode: boolean;

  /** True if any file matches configuration patterns */
  readonly hasConfiguration: boolean;

  /** True if any file matches test patterns */
  readonly hasTests: boolean;
}

/**
 * Decision about which CI workflow steps to execute
 */
export interface WorkflowDecision {
  /** Whether to run Prettier and ESLint checks */
  runLinting: boolean;

  /** Whether to run test suites */
  runTests: boolean;

  /** Whether to run frontend and backend builds */
  runBuild: boolean;

  /** Whether to deploy to Firebase */
  runDeployment: boolean;

  /** Human-readable explanation of the decision */
  reason: string;
}

/**
 * Configuration for file pattern matching
 */
export interface FilePatternsConfig {
  /** Glob patterns for documentation files */
  documentation: string[];

  /** Glob patterns for source code */
  sourceCode: string[];

  /** Glob patterns for configuration files */
  configuration: string[];

  /** Glob patterns for test files */
  tests: string[];
}

/**
 * Main API: Categorize changed files
 *
 * @param files - Array of file paths relative to repository root
 * @param config - Pattern configuration (uses default if not provided)
 * @returns Categorized file change set
 * @throws Error if files array is empty or contains absolute paths
 */
export function categorizeFiles(files: string[], config?: FilePatternsConfig): FileChangeSet;

/**
 * Determine which workflow steps to run based on file changes
 *
 * @param changeSet - Categorized file change set
 * @returns Workflow execution decision
 */
export function determineWorkflowSteps(changeSet: FileChangeSet): WorkflowDecision;

/**
 * Get default file pattern configuration
 *
 * @returns Default pattern config based on project structure
 */
export function getDefaultPatterns(): FilePatternsConfig;

/**
 * Normalize file paths (convert Windows backslashes, ensure relative)
 *
 * @param paths - Array of file paths (potentially with backslashes or absolute)
 * @returns Normalized relative paths with forward slashes
 * @throws Error if path escapes repository root (e.g., ../../../etc/passwd)
 */
export function normalizeFilePaths(paths: string[]): string[];
