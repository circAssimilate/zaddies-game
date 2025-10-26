/**
 * File Categorization Types
 *
 * Type definitions for categorizing changed files to determine
 * which CI workflow steps should execute.
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

  /** True if source code changes are frontend-only */
  readonly isFrontendOnly: boolean;

  /** True if source code changes are backend-only */
  readonly isBackendOnly: boolean;

  /** True if all code changes are test-only (no source code) */
  readonly isTestOnly: boolean;

  /** True if changes include frontend source code */
  readonly hasFrontend: boolean;

  /** True if changes include backend source code */
  readonly hasBackend: boolean;

  /** True if changes include shared source code */
  readonly hasShared: boolean;
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

  /** Whether to run frontend-specific tests */
  runFrontendTests: boolean;

  /** Whether to run backend-specific tests */
  runBackendTests: boolean;

  /** Whether to build frontend */
  runFrontendBuild: boolean;

  /** Whether to build backend */
  runBackendBuild: boolean;

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
