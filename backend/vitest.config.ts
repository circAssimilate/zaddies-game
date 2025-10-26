import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup.ts',
    // Run tests sequentially to avoid Firestore race conditions in integration tests
    fileParallelism: false,
    // Force tests within files to also run sequentially
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Increase test timeout for slower emulator operations
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*', '**/lib'],
    },
  },
});
