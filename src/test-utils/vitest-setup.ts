import { beforeAll, afterAll } from 'vitest';
import { setupTests, teardownTests } from './test-setup.js';

// Global test setup - runs once per worker
beforeAll(setupTests, 5_000);

// Global test teardown - runs once per worker
afterAll(teardownTests, 10_000);
