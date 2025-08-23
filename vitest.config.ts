import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use Node.js environment for testing
    environment: 'node',

    // Enable global test functions (describe, it, expect)
    globals: true,

    // Setup files to run before tests
    setupFiles: ['./src/test-utils/vitest-setup.ts'],

    // Timeout settings for browser operations
    testTimeout: 30000, // 30 seconds for individual tests
    hookTimeout: 5_000,  // 10 seconds for setup/teardown hooks
    teardownTimeout: 5_000, // 5 seconds for cleanup

    // Test file patterns - look for .test.ts files in _tests directories
    include: ['src/**/_tests/**/*.test.ts'],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'src/**/_tests/**/test-resources/**', // Exclude test resource files
      '.git',
      '.kiro'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/_tests/**', // Exclude all test files
        'src/test-utils/vitest-setup.ts', // Exclude test setup file
        'src/**/*.d.ts' // Exclude type definition files
        // Note: test-utils utility files (like test-web-server.ts) are now included in coverage
      ],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },

    // Parallel execution settings
    pool: 'threads',
    poolOptions: {
      threads: {
        // Limit concurrency for browser resources to avoid conflicts
        maxThreads: 4, // Run tests sequentially to avoid browser conflicts
        minThreads: 1
      }
    }
  }
});