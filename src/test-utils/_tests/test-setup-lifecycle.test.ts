import type { Page } from 'puppeteer-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cleanupTestBrowser,
  createTestPage,
  getTestBrowser,
  isTestBrowserAvailable,
  teardownTests,
} from '../index.js'

describe('Test Setup - Lifecycle Management', () => {
  let testPage: Page | null = null

  afterEach(async () => {
    // Clean up test page after each test
    if (testPage && !testPage.isClosed()) {
      await testPage.close()
      testPage = null
    }
  })

  describe('setup and teardown functions', () => {
    it('should handle teardown gracefully', async () => {
      // Ensure browser is running first
      await getTestBrowser()
      expect(isTestBrowserAvailable()).toBe(true)

      await expect(teardownTests()).resolves.toBeUndefined()
    })
  })

  describe('browser cleanup', () => {
    it('should clean up browser resources', async () => {
      // Start with a fresh browser
      const browser = await getTestBrowser()
      expect(browser.connected).toBe(true)

      // Create a test page
      testPage = await createTestPage('cleanup-test')
      expect(testPage.isClosed()).toBe(false)

      // Cleanup should close everything
      await cleanupTestBrowser()

      // Page should be closed after cleanup
      expect(testPage.isClosed()).toBe(true)
      testPage = null // Prevent afterEach from trying to close it again
    })

    it('should handle cleanup errors gracefully', async () => {
      // This should not throw even if there's nothing to clean up
      await expect(cleanupTestBrowser()).resolves.toBeUndefined()
    })
  })

  describe('environment variable handling', () => {
    it.skip('should respect SHOW_BROWSER environment variable and show the browser', async () => {
      const originalEnv = process.env.SHOW_BROWSER

      try {
        process.env.SHOW_BROWSER = 'true'

        // Clean up any existing browser first
        await cleanupTestBrowser()

        // Get a new browser (this will use the environment variable)
        const browser = await getTestBrowser()
        expect(browser.connected).toBe(true)

        // Reset for other tests
        await cleanupTestBrowser()
      } finally {
        // Restore original environment
        if (originalEnv !== undefined) {
          process.env.SHOW_BROWSER = originalEnv
        } else {
          delete process.env.SHOW_BROWSER
        }
      }
    })
  })

  describe('page creation error handling', () => {
    it('should handle page creation failures gracefully', async () => {
      // This tests the error handling in createTestPage
      const browser = await getTestBrowser()

      // Mock newPage to throw an error
      const originalNewPage = browser.newPage
      browser.newPage = vi.fn().mockRejectedValue(new Error('Page creation failed'))

      try {
        await expect(createTestPage('error-test')).rejects.toThrow(
          'Failed to create test page for error-test: Page creation failed',
        )
      } finally {
        // Restore original method
        browser.newPage = originalNewPage
      }
    })
  })

  describe('edge cases', () => {
    it('should handle multiple cleanup calls', async () => {
      // Ensure browser exists
      await getTestBrowser()

      // Multiple cleanups should not cause errors
      await cleanupTestBrowser()
      await cleanupTestBrowser()
      await cleanupTestBrowser()

      expect(isTestBrowserAvailable()).toBe(false)
    })
  })
})
