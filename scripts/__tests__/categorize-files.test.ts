/**
 * Unit tests for file categorization logic
 */

import {
  categorizeFiles,
  getDefaultPatterns,
  normalizeFilePaths,
  determineWorkflowSteps,
} from '../categorize-files';
import { FileCategory } from '../../shared/src/types/file-categorization';

describe('normalizeFilePaths', () => {
  it('should convert backslashes to forward slashes', () => {
    const paths = ['src\\components\\Button.tsx', 'tests\\unit\\app.test.ts'];
    const normalized = normalizeFilePaths(paths);
    expect(normalized).toEqual(['src/components/Button.tsx', 'tests/unit/app.test.ts']);
  });

  it('should remove leading ./ if present', () => {
    const paths = ['./src/index.ts', './README.md'];
    const normalized = normalizeFilePaths(paths);
    expect(normalized).toEqual(['src/index.ts', 'README.md']);
  });

  it('should throw error for absolute paths', () => {
    expect(() => normalizeFilePaths(['/etc/passwd'])).toThrow('Absolute paths not allowed');
  });

  it('should throw error for paths escaping repository root', () => {
    expect(() => normalizeFilePaths(['../../etc/passwd'])).toThrow(
      'Path attempts to escape repository root'
    );
  });

  it('should handle empty array', () => {
    const normalized = normalizeFilePaths([]);
    expect(normalized).toEqual([]);
  });
});

describe('getDefaultPatterns', () => {
  it('should return pattern configuration with all categories', () => {
    const patterns = getDefaultPatterns();
    expect(patterns).toHaveProperty('documentation');
    expect(patterns).toHaveProperty('sourceCode');
    expect(patterns).toHaveProperty('configuration');
    expect(patterns).toHaveProperty('tests');
  });

  it('should include common documentation patterns', () => {
    const patterns = getDefaultPatterns();
    expect(patterns.documentation).toContain('**/*.md');
    expect(patterns.documentation).toContain('README.md');
  });

  it('should include common source code patterns', () => {
    const patterns = getDefaultPatterns();
    expect(patterns.sourceCode).toContain('frontend/src/**/*.{ts,tsx,js,jsx}');
    expect(patterns.sourceCode).toContain('backend/src/**/*.{ts,tsx,js,jsx}');
  });

  it('should include common configuration patterns', () => {
    const patterns = getDefaultPatterns();
    expect(patterns.configuration).toContain('package.json');
    expect(patterns.configuration).toContain('tsconfig*.json');
  });

  it('should include common test patterns', () => {
    const patterns = getDefaultPatterns();
    expect(patterns.tests).toContain('**/*.test.ts');
    expect(patterns.tests).toContain('**/*.spec.ts');
  });
});

describe('categorizeFiles', () => {
  it('should throw error for empty file list', () => {
    expect(() => categorizeFiles([])).toThrow('Cannot categorize empty file list');
  });

  it('should categorize documentation files', () => {
    const files = ['README.md', 'docs/guide.md', 'CONTRIBUTING.md'];
    const result = categorizeFiles(files);

    expect(result.files).toEqual(files);
    expect(result.categories).toEqual([
      FileCategory.DOCUMENTATION,
      FileCategory.DOCUMENTATION,
      FileCategory.DOCUMENTATION,
    ]);
    expect(result.isDocumentationOnly).toBe(true);
    expect(result.hasSourceCode).toBe(false);
    expect(result.hasConfiguration).toBe(false);
    expect(result.hasTests).toBe(false);
  });

  it('should categorize source code files', () => {
    const files = ['frontend/src/App.tsx', 'backend/src/index.ts', 'shared/src/utils.ts'];
    const result = categorizeFiles(files);

    expect(result.categories).toEqual([
      FileCategory.SOURCE_CODE,
      FileCategory.SOURCE_CODE,
      FileCategory.SOURCE_CODE,
    ]);
    expect(result.hasSourceCode).toBe(true);
    expect(result.isDocumentationOnly).toBe(false);
  });

  it('should categorize configuration files', () => {
    const files = ['package.json', 'tsconfig.json', '.github/workflows/ci.yml'];
    const result = categorizeFiles(files);

    expect(result.categories).toEqual([
      FileCategory.CONFIGURATION,
      FileCategory.CONFIGURATION,
      FileCategory.CONFIGURATION,
    ]);
    expect(result.hasConfiguration).toBe(true);
  });

  it('should categorize test files', () => {
    const files = ['src/App.test.tsx', 'tests/integration/api.spec.ts'];
    const result = categorizeFiles(files);

    expect(result.categories).toEqual([FileCategory.TESTS, FileCategory.TESTS]);
    expect(result.hasTests).toBe(true);
  });

  it('should handle mixed file types', () => {
    const files = ['README.md', 'src/App.tsx', 'package.json'];
    const result = categorizeFiles(files);

    expect(result.categories).toEqual([
      FileCategory.DOCUMENTATION,
      FileCategory.SOURCE_CODE,
      FileCategory.CONFIGURATION,
    ]);
    expect(result.isDocumentationOnly).toBe(false);
    expect(result.hasSourceCode).toBe(true);
    expect(result.hasConfiguration).toBe(true);
  });

  it('should categorize unknown files as OTHER', () => {
    const files = ['random.xyz', 'unknown/file.abc'];
    const result = categorizeFiles(files);

    expect(result.categories).toEqual([FileCategory.OTHER, FileCategory.OTHER]);
  });
});

describe('determineWorkflowSteps', () => {
  it('should skip build and deployment for documentation-only changes', () => {
    const changeSet = categorizeFiles(['README.md', 'docs/guide.md']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runTests).toBe(false);
    expect(decision.runBuild).toBe(false);
    expect(decision.runDeployment).toBe(false);
    expect(decision.reason).toContain('Documentation-only');
  });

  it('should run full pipeline for source code changes', () => {
    const changeSet = categorizeFiles(['src/App.tsx', 'src/index.ts']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runTests).toBe(true);
    expect(decision.runBuild).toBe(true);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Source code changes');
  });

  it('should run full pipeline for configuration changes', () => {
    const changeSet = categorizeFiles(['package.json', 'tsconfig.json']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runTests).toBe(true);
    expect(decision.runBuild).toBe(true);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Configuration changes');
  });

  it('should run tests but skip deployment for test-only changes', () => {
    const changeSet = categorizeFiles(['src/App.test.tsx', 'tests/unit/utils.spec.ts']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runTests).toBe(true);
    expect(decision.runBuild).toBe(false);
    expect(decision.runDeployment).toBe(false);
    expect(decision.reason).toContain('Test-only changes');
  });

  it('should run full pipeline for mixed changes', () => {
    const changeSet = categorizeFiles(['README.md', 'src/App.tsx']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runTests).toBe(true);
    expect(decision.runBuild).toBe(true);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Source code changes');
  });

  it('should run full pipeline for unknown file types', () => {
    const changeSet = categorizeFiles(['unknown.xyz']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runTests).toBe(true);
    expect(decision.runBuild).toBe(true);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Unknown file types');
  });

  it('should skip backend tests/build for frontend-only changes', () => {
    const changeSet = categorizeFiles([
      'frontend/src/App.tsx',
      'frontend/src/components/Button.tsx',
    ]);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runFrontendTests).toBe(true);
    expect(decision.runBackendTests).toBe(false);
    expect(decision.runFrontendBuild).toBe(true);
    expect(decision.runBackendBuild).toBe(false);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Frontend-only');
  });

  it('should skip frontend tests/build for backend-only changes', () => {
    const changeSet = categorizeFiles([
      'backend/src/functions/index.ts',
      'backend/src/utils/helpers.ts',
    ]);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runFrontendTests).toBe(false);
    expect(decision.runBackendTests).toBe(true);
    expect(decision.runFrontendBuild).toBe(false);
    expect(decision.runBackendBuild).toBe(true);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Backend-only');
  });

  it('should run full pipeline for shared code changes', () => {
    const changeSet = categorizeFiles(['shared/src/types/game.ts']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runFrontendTests).toBe(true);
    expect(decision.runBackendTests).toBe(true);
    expect(decision.runFrontendBuild).toBe(true);
    expect(decision.runBackendBuild).toBe(true);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Shared code changes');
  });

  it('should run full pipeline for mixed frontend/backend changes', () => {
    const changeSet = categorizeFiles(['frontend/src/App.tsx', 'backend/src/functions/index.ts']);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runFrontendTests).toBe(true);
    expect(decision.runBackendTests).toBe(true);
    expect(decision.runFrontendBuild).toBe(true);
    expect(decision.runBackendBuild).toBe(true);
    expect(decision.runDeployment).toBe(true);
    expect(decision.reason).toContain('Mixed code changes');
  });

  it('should skip build for test-only changes', () => {
    const changeSet = categorizeFiles([
      'frontend/tests/App.test.tsx',
      'backend/tests/unit/helpers.test.ts',
    ]);
    const decision = determineWorkflowSteps(changeSet);

    expect(decision.runLinting).toBe(true);
    expect(decision.runTests).toBe(true);
    expect(decision.runFrontendTests).toBe(true);
    expect(decision.runBackendTests).toBe(true);
    expect(decision.runBuild).toBe(false);
    expect(decision.runFrontendBuild).toBe(false);
    expect(decision.runBackendBuild).toBe(false);
    expect(decision.runDeployment).toBe(false);
    expect(decision.reason).toContain('Test-only');
  });
});

describe('categorizeFiles - frontend/backend/shared detection', () => {
  it('should detect frontend-only changes', () => {
    const changeSet = categorizeFiles([
      'frontend/src/App.tsx',
      'frontend/src/components/Button.tsx',
    ]);
    expect(changeSet.hasFrontend).toBe(true);
    expect(changeSet.hasBackend).toBe(false);
    expect(changeSet.hasShared).toBe(false);
    expect(changeSet.isFrontendOnly).toBe(true);
    expect(changeSet.isBackendOnly).toBe(false);
  });

  it('should detect backend-only changes', () => {
    const changeSet = categorizeFiles([
      'backend/src/functions/index.ts',
      'backend/src/utils/helpers.ts',
    ]);
    expect(changeSet.hasFrontend).toBe(false);
    expect(changeSet.hasBackend).toBe(true);
    expect(changeSet.hasShared).toBe(false);
    expect(changeSet.isFrontendOnly).toBe(false);
    expect(changeSet.isBackendOnly).toBe(true);
  });

  it('should detect shared code changes', () => {
    const changeSet = categorizeFiles(['shared/src/types/game.ts']);
    expect(changeSet.hasFrontend).toBe(false);
    expect(changeSet.hasBackend).toBe(false);
    expect(changeSet.hasShared).toBe(true);
    expect(changeSet.isFrontendOnly).toBe(false);
    expect(changeSet.isBackendOnly).toBe(false);
  });

  it('should detect mixed frontend/backend changes', () => {
    const changeSet = categorizeFiles(['frontend/src/App.tsx', 'backend/src/functions/index.ts']);
    expect(changeSet.hasFrontend).toBe(true);
    expect(changeSet.hasBackend).toBe(true);
    expect(changeSet.hasShared).toBe(false);
    expect(changeSet.isFrontendOnly).toBe(false);
    expect(changeSet.isBackendOnly).toBe(false);
  });

  it('should detect test-only changes', () => {
    const changeSet = categorizeFiles([
      'frontend/tests/App.test.tsx',
      'backend/tests/unit/helpers.test.ts',
    ]);
    expect(changeSet.hasTests).toBe(true);
    expect(changeSet.hasSourceCode).toBe(false);
    expect(changeSet.isTestOnly).toBe(true);
  });

  it('should not be test-only if source code is also changed', () => {
    const changeSet = categorizeFiles(['frontend/src/App.tsx', 'frontend/tests/App.test.tsx']);
    expect(changeSet.hasTests).toBe(true);
    expect(changeSet.hasSourceCode).toBe(true);
    expect(changeSet.isTestOnly).toBe(false);
  });
});
