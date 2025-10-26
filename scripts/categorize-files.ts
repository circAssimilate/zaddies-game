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

  return {
    files: normalizedFiles,
    categories,
    isDocumentationOnly,
    hasSourceCode,
    hasConfiguration,
    hasTests,
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
      reason: 'Documentation-only changes - skipping tests, build, and deployment',
    };
  }

  // Configuration changes: Run everything for safety
  if (changeSet.hasConfiguration) {
    return {
      runLinting: true,
      runTests: true,
      runBuild: true,
      runDeployment: true,
      reason: 'Configuration changes detected - running full pipeline for safety',
    };
  }

  // Source code changes: Run everything
  if (changeSet.hasSourceCode) {
    return {
      runLinting: true,
      runTests: true,
      runBuild: true,
      runDeployment: true,
      reason: 'Source code changes detected - running full pipeline',
    };
  }

  // Test-only changes: Run tests but skip deployment
  if (changeSet.hasTests) {
    return {
      runLinting: true,
      runTests: true,
      runBuild: false,
      runDeployment: false,
      reason: 'Test-only changes - running tests but skipping deployment',
    };
  }

  // Other/unknown: Run everything to be safe
  return {
    runLinting: true,
    runTests: true,
    runBuild: true,
    runDeployment: true,
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
