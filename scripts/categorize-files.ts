/**
 * File Categorization Utility
 *
 * Categorizes changed files to determine which CI workflow steps should execute.
 * Used by GitHub Actions workflows and pre-commit hooks.
 */

import {
  FileCategory,
  FileChangeSet,
  FilePatternsConfig,
  WorkflowDecision,
} from '../shared/src/types/file-categorization';

/**
 * Get default file pattern configuration based on project structure
 */
export function getDefaultPatterns(): FilePatternsConfig {
  return {
    documentation: [
      '**/*.md',
      'docs/**/*',
      'README.md',
      'CHANGELOG.md',
      'CONTRIBUTING.md',
      '.github/ISSUE_TEMPLATE/**',
      '.github/PULL_REQUEST_TEMPLATE/**',
    ],
    sourceCode: [
      'frontend/src/**/*.{ts,tsx,js,jsx}',
      'backend/src/**/*.{ts,tsx,js,jsx}',
      'shared/src/**/*.{ts,tsx,js,jsx}',
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
    ],
    configuration: [
      'package.json',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig*.json',
      '.eslintrc.json',
      '.prettierrc',
      'firebase.json',
      '.firebaserc',
      '.github/workflows/**',
    ],
    tests: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/tests/**',
      '**/__tests__/**',
    ],
  };
}

/**
 * Normalize file paths (convert Windows backslashes, ensure relative)
 *
 * @param paths - Array of file paths (potentially with backslashes or absolute)
 * @returns Normalized relative paths with forward slashes
 * @throws Error if path escapes repository root (e.g., ../../../etc/passwd)
 */
export function normalizeFilePaths(paths: string[]): string[] {
  return paths.map(path => {
    // Convert backslashes to forward slashes (Windows compatibility)
    let normalized = path.replace(/\\/g, '/');

    // Remove leading ./ if present
    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2);
    }

    // Check for attempts to escape repository root
    if (normalized.includes('../') && normalized.split('../').length > 2) {
      throw new Error(`Path attempts to escape repository root: ${path}`);
    }

    // Remove absolute path prefixes if present (shouldn't happen, but be safe)
    if (normalized.startsWith('/')) {
      throw new Error(`Absolute paths not allowed: ${path}`);
    }

    return normalized;
  });
}

/**
 * Check if a file path matches any of the glob patterns
 */
function matchesPattern(filePath: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Convert glob pattern to regex
    // Simple implementation - handles **, *, and literal matches
    const regexPattern = pattern
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\*\*/g, '.*') // ** matches any characters including /
      .replace(/\*/g, '[^/]*') // * matches any characters except /
      .replace(/\{([^}]+)\}/g, '($1)') // {a,b,c} becomes (a|b|c)
      .replace(/,/g, '|'); // Convert commas to regex OR

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  });
}

/**
 * Categorize a single file based on patterns
 */
function categorizeFile(filePath: string, config: FilePatternsConfig): FileCategory {
  // Check in priority order - most specific first
  if (matchesPattern(filePath, config.tests)) {
    return FileCategory.TESTS;
  }
  if (matchesPattern(filePath, config.configuration)) {
    return FileCategory.CONFIGURATION;
  }
  if (matchesPattern(filePath, config.sourceCode)) {
    return FileCategory.SOURCE_CODE;
  }
  if (matchesPattern(filePath, config.documentation)) {
    return FileCategory.DOCUMENTATION;
  }
  return FileCategory.OTHER;
}

/**
 * Main API: Categorize changed files
 *
 * @param files - Array of file paths relative to repository root
 * @param config - Pattern configuration (uses default if not provided)
 * @returns Categorized file change set
 * @throws Error if files array is empty or contains absolute paths
 */
export function categorizeFiles(files: string[], config?: FilePatternsConfig): FileChangeSet {
  if (!files || files.length === 0) {
    throw new Error('Cannot categorize empty file list');
  }

  const normalizedFiles = normalizeFilePaths(files);
  const patterns = config || getDefaultPatterns();

  const categories = normalizedFiles.map(file => categorizeFile(file, patterns));

  // Compute derived properties
  const isDocumentationOnly = categories.every(cat => cat === FileCategory.DOCUMENTATION);
  const hasSourceCode = categories.some(cat => cat === FileCategory.SOURCE_CODE);
  const hasConfiguration = categories.some(cat => cat === FileCategory.CONFIGURATION);
  const hasTests = categories.some(cat => cat === FileCategory.TESTS);

  // Detect frontend/backend/shared patterns
  const frontendPattern = /^frontend\//;
  const backendPattern = /^backend\//;
  const sharedPattern = /^shared\//;

  const hasFrontend = normalizedFiles.some(
    (file, i) =>
      frontendPattern.test(file) &&
      (categories[i] === FileCategory.SOURCE_CODE || categories[i] === FileCategory.TESTS)
  );

  const hasBackend = normalizedFiles.some(
    (file, i) =>
      backendPattern.test(file) &&
      (categories[i] === FileCategory.SOURCE_CODE || categories[i] === FileCategory.TESTS)
  );

  const hasShared = normalizedFiles.some(
    (file, i) =>
      sharedPattern.test(file) &&
      (categories[i] === FileCategory.SOURCE_CODE || categories[i] === FileCategory.TESTS)
  );

  // Determine if changes are frontend-only, backend-only, or test-only
  const sourceCodeFiles = normalizedFiles.filter(
    (_, i) => categories[i] === FileCategory.SOURCE_CODE
  );
  const isFrontendOnly =
    hasSourceCode &&
    hasFrontend &&
    !hasBackend &&
    !hasShared &&
    sourceCodeFiles.every(f => frontendPattern.test(f));

  const isBackendOnly =
    hasSourceCode &&
    hasBackend &&
    !hasFrontend &&
    !hasShared &&
    sourceCodeFiles.every(f => backendPattern.test(f));

  const isTestOnly = !hasSourceCode && hasTests;

  return {
    files: normalizedFiles,
    categories,
    isDocumentationOnly,
    hasSourceCode,
    hasConfiguration,
    hasTests,
    hasFrontend,
    hasBackend,
    hasShared,
    isFrontendOnly,
    isBackendOnly,
    isTestOnly,
  };
}

/**
 * Determine which workflow steps to run based on file changes
 *
 * @param changeSet - Categorized file change set
 * @returns Workflow execution decision
 */
export function determineWorkflowSteps(changeSet: FileChangeSet): WorkflowDecision {
  // Documentation-only: Skip build and deployment
  if (changeSet.isDocumentationOnly) {
    return {
      runLinting: true,
      runTests: false,
      runBuild: false,
      runDeployment: false,
      runFrontendTests: false,
      runBackendTests: false,
      runFrontendBuild: false,
      runBackendBuild: false,
      reason: 'Documentation-only changes - skipping tests, build, and deployment',
    };
  }

  // Test-only changes: Run tests but skip build and deployment
  if (changeSet.isTestOnly) {
    return {
      runLinting: true,
      runTests: true,
      runBuild: false,
      runDeployment: false,
      runFrontendTests: changeSet.hasFrontend,
      runBackendTests: changeSet.hasBackend,
      runFrontendBuild: false,
      runBackendBuild: false,
      reason: 'Test-only changes - running tests but skipping build and deployment',
    };
  }

  // Frontend-only changes: Skip backend tests and builds
  if (changeSet.isFrontendOnly) {
    return {
      runLinting: true,
      runTests: true,
      runBuild: true,
      runDeployment: true,
      runFrontendTests: true,
      runBackendTests: false,
      runFrontendBuild: true,
      runBackendBuild: false,
      reason: 'Frontend-only changes - skipping backend tests and build',
    };
  }

  // Backend-only changes: Skip frontend tests and builds
  if (changeSet.isBackendOnly) {
    return {
      runLinting: true,
      runTests: true,
      runBuild: true,
      runDeployment: true,
      runFrontendTests: false,
      runBackendTests: true,
      runFrontendBuild: false,
      runBackendBuild: true,
      reason: 'Backend-only changes - skipping frontend tests and build',
    };
  }

  // Configuration changes or mixed source code: Run everything for safety
  if (changeSet.hasConfiguration || changeSet.hasSourceCode || changeSet.hasShared) {
    return {
      runLinting: true,
      runTests: true,
      runBuild: true,
      runDeployment: true,
      runFrontendTests: true,
      runBackendTests: true,
      runFrontendBuild: true,
      runBackendBuild: true,
      reason: changeSet.hasConfiguration
        ? 'Configuration changes detected - running full pipeline for safety'
        : changeSet.hasShared
          ? 'Shared code changes detected - running full pipeline'
          : 'Mixed code changes detected - running full pipeline',
    };
  }

  // Other/unknown: Run everything to be safe
  return {
    runLinting: true,
    runTests: true,
    runBuild: true,
    runDeployment: true,
    runFrontendTests: true,
    runBackendTests: true,
    runFrontendBuild: true,
    runBackendBuild: true,
    reason: 'Unknown file types - running full pipeline for safety',
  };
}

// CLI usage for GitHub Actions
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: ts-node categorize-files.ts <file1> <file2> ...');
    process.exit(1);
  }

  try {
    const changeSet = categorizeFiles(args);
    const decision = determineWorkflowSteps(changeSet);

    console.log(
      JSON.stringify(
        {
          changeSet,
          decision,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
