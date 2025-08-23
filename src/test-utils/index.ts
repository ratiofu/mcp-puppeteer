// Export all test utilities for easy importing

// Browser management utilities
export {
  getTestBrowser,
  isTestBrowserAvailable,
  cleanupTestBrowser,
  createTestPage,
  setupTests,
  teardownTests,
  handleBrowserConnectionError
} from './test-setup.js';

// Test helper functions
export {
  createTestPageWithContent,
  waitForElement,
  waitForPageLoad,
  getElementText,
  elementExists,
  getCurrentUrl,
  takeScreenshotBase64,
  executeScript,
  clearConsole,
  getConsoleLogs,
  safeClosePage,
  createTestHtml
} from './test-helpers.js';