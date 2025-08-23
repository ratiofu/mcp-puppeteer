# Test Utilities

This directory contains comprehensive test utilities for browser automation testing using Puppeteer and Vitest.

## Features

- **Headless by default**: Tests run in headless Chromium for speed and CI compatibility
- **Visible mode**: Set `SHOW_BROWSER=1` or `SHOW_BROWSER=true` to see the browser during tests
- **Dedicated Chromium instances**: Each test run uses its own Chromium instance to avoid conflicts
- **Shared browser management**: Single browser instance shared across all tests in a run for performance
- **Comprehensive utilities**: Helper functions for common browser testing tasks

## Usage

### Running Tests

```bash
# Run tests in headless mode (default)
pnpm test

# Run tests with visible browser
SHOW_BROWSER=1 pnpm test

# Run specific test files
pnpm test src/test-utils/_tests/test-setup.test.ts
```

### Browser Management

```typescript
import { getTestBrowser, createTestPage, cleanupTestBrowser } from '../test-utils';

// Get shared browser instance
const browser = await getTestBrowser();

// Create isolated test page
const page = await createTestPage('my-test');

// Clean up (handled automatically by vitest setup)
await cleanupTestBrowser();
```

### Test Helpers

```typescript
import { 
  createTestPageWithContent,
  waitForElement,
  getElementText,
  takeScreenshotBase64,
  createTestHtml 
} from '../test-utils';

// Create page with HTML content
const page = await createTestPageWithContent('<h1>Test</h1>', 'test-name');

// Wait for elements and interact
await waitForElement(page, '#my-button');
const text = await getElementText(page, 'h1');

// Take screenshots
const screenshot = await takeScreenshotBase64(page);

// Generate test HTML
const html = createTestHtml('My Test Page', true); // with console scripts
```

## Architecture

### Browser Lifecycle

1. **Setup**: Vitest global setup launches a dedicated Chromium instance per test file
2. **Tests**: Each test gets its own isolated page (tab) from the shared browser instance
3. **Teardown**: Vitest global teardown closes the browser and cleans up resources

### Page Management

- **One browser instance per test file** - Shared across all tests in that file
- **One page (tab) per test** - Created via `createTestPage()` for isolation
- **Automatic cleanup** - Pages are closed after each test, browser after all tests

### Profile Management

- Each test run uses a unique temporary profile: `/tmp/chromium-test-profile-{timestamp}-{random}`
- Profiles are automatically cleaned up when the browser closes
- No interference with user's main browser or other test runs

### Environment Variables

- `SHOW_BROWSER=1` or `SHOW_BROWSER=true`: Run tests with visible browser
- Default: Headless mode for speed and CI compatibility

## Requirements

- Chromium must be installed and accessible
- On macOS: `brew install chromium`
- The system will automatically find Chromium in common locations

## Troubleshooting

If tests fail to launch the browser:

1. Install Chromium: `brew install chromium`
2. Clear test profiles: `rm -rf /tmp/chromium-test-profile-*`
3. Check that port 9223 is not blocked
4. Verify Chromium is in PATH: `which chromium`

## Files

- `test-setup.ts` - Core browser management and lifecycle
- `test-helpers.ts` - Common testing utilities and helpers
- `vitest-setup.ts` - Vitest integration for global setup/teardown
- `index.ts` - Centralized exports for easy importing
- `_tests/` - Test files for the utilities themselves