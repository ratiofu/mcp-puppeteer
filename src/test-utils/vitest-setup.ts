import { beforeAll, afterAll } from 'vitest';
import { setupTests, teardownTests } from './test-setup.js';

/**
 * Global test setup - runs once before all tests
 * Initializes the shared browser instance
 */
beforeAll(async () => {
  console.log('Running global test setup...');
  await setupTests();
}, 5_000); // 5 second timeout for browser initialization

/**
 * Global test teardown - runs once after all tests
 * Cleans up the shared browser instance
 */
afterAll(async () => {
  console.log('Running global test teardown...');
  await teardownTests();
}, 5_000); // 5 second timeout for cleanup