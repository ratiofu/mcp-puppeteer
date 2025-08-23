import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Page } from 'puppeteer-core';
import { 
  getTestBrowser, 
  isTestBrowserAvailable, 
  createTestPage,
  handleBrowserConnectionError
} from '../index.js';

describe('Test Setup and Browser Management', () => {
  let testPage: Page | null = null;

  afterEach(async () => {
    // Clean up test page after each test
    if (testPage && !testPage.isClosed()) {
      await testPage.close();
      testPage = null;
    }
  });

  describe('getTestBrowser', () => {
    it('should return a connected browser instance', async () => {
      const browser = await getTestBrowser();
      
      expect(browser).toBeDefined();
      expect(browser.connected).toBe(true);
    });

    it('should return the same browser instance on multiple calls', async () => {
      const browser1 = await getTestBrowser();
      const browser2 = await getTestBrowser();
      
      expect(browser1).toBe(browser2);
    });
  });

  describe('isTestBrowserAvailable', () => {
    it('should return true when browser is available', async () => {
      // Ensure browser is initialized
      await getTestBrowser();
      
      expect(isTestBrowserAvailable()).toBe(true);
    });
  });

  describe('createTestPage', () => {
    it('should create a new browser page', async () => {
      testPage = await createTestPage('test-page-creation');
      
      expect(testPage).toBeDefined();
      expect(testPage.isClosed()).toBe(false);
    });

    it('should create isolated pages for different tests', async () => {
      const page1 = await createTestPage('test-isolation-1');
      const page2 = await createTestPage('test-isolation-2');
      
      expect(page1).not.toBe(page2);
      expect(page1.isClosed()).toBe(false);
      expect(page2.isClosed()).toBe(false);
      
      // Clean up both pages
      await page1.close();
      await page2.close();
    });

    it('should set custom user agent with test name', async () => {
      const testName = 'user-agent-test';
      testPage = await createTestPage(testName);
      
      const userAgent = await testPage.evaluate(() => navigator.userAgent);
      expect(userAgent).toContain(`Test-Agent-${testName}`);
    });
  });

  describe('error handling', () => {
    it('should provide helpful error messages for browser connection failures', () => {
      const testError = new Error('Connection refused');
      
      expect(() => {
        handleBrowserConnectionError(testError, 'test operation');
      }).toThrow('test operation failed: Connection refused');
    });

    it('should handle non-Error objects', () => {
      const testError = 'String error message';
      
      expect(() => {
        handleBrowserConnectionError(testError, 'test operation');
      }).toThrow('test operation failed: String error message');
    });
  });

  describe('browser lifecycle', () => {
    it('should maintain browser connection throughout test execution', async () => {
      const browser = await getTestBrowser();
      
      // Create and use a page
      testPage = await createTestPage('lifecycle-test');
      await testPage.goto('data:text/html,<h1>Test Page</h1>');
      
      const title = await testPage.evaluate(() => document.querySelector('h1')?.textContent);
      expect(title).toBe('Test Page');
      
      // Browser should still be connected
      expect(browser.connected).toBe(true);
    });
  });
});