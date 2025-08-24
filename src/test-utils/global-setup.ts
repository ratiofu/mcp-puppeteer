import { errorToString } from '../utils/error.js';

export default async function globalSetup() {
  // Return a teardown function that runs once after the entire test run
  return async () => {
    try {
      const { execSync } = await import('node:child_process');
      execSync("pkill -KILL -f -- '--user-data-dir=/tmp/chromium-test-profile-' || true", {
        stdio: 'ignore'
      });
    } catch (err) {
      console.warn('globalSetup: final Chromium kill sweep failed:', errorToString(err));
    }
  };
}

