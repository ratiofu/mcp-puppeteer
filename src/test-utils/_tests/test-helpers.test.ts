import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Page } from 'puppeteer-core';
import { 
  createTestPageWithContent,
  waitForElement,
  getElementText,
  elementExists,
  getCurrentUrl,
  takeScreenshotBase64,
  executeScript,
  safeClosePage,
  createTestHtml
} from '../test-helpers.js';

describe('Test Helpers', () => {
  let testPage: Page | null = null;

  afterEach(async () => {
    if (testPage) {
      await safeClosePage(testPage);
      testPage = null;
    }
  });

  describe('createTestPageWithContent', () => {
    it('should create a page with HTML content', async () => {
      const html = '<h1>Test Content</h1><p>Hello World</p>';
      testPage = await createTestPageWithContent(html, 'content-test');
      
      const title = await getElementText(testPage, 'h1');
      expect(title).toBe('Test Content');
      
      const paragraph = await getElementText(testPage, 'p');
      expect(paragraph).toBe('Hello World');
    });
  });

  describe('element utilities', () => {
    let elementUtilsPage: Page | null = null;
    
    beforeEach(async () => {
      const html = createTestHtml('Helper Test Page', true);
      elementUtilsPage = await createTestPageWithContent(html, 'element-utils-test');
    });
    
    afterEach(async () => {
      if (elementUtilsPage) {
        await safeClosePage(elementUtilsPage);
        elementUtilsPage = null;
      }
    });

    it('should wait for elements to be present', async () => {
      await waitForElement(elementUtilsPage!, '#test-button');
      const exists = await elementExists(elementUtilsPage!, '#test-button');
      expect(exists).toBe(true);
    });

    it('should get element text content', async () => {
      const buttonText = await getElementText(elementUtilsPage!, '#test-button');
      expect(buttonText).toBe('Click Me');
      
      const headingText = await getElementText(elementUtilsPage!, 'h1');
      expect(headingText).toBe('Helper Test Page');
    });

    it('should check element existence', async () => {
      const buttonExists = await elementExists(elementUtilsPage!, '#test-button');
      expect(buttonExists).toBe(true);
      
      const nonExistentExists = await elementExists(elementUtilsPage!, '#non-existent');
      expect(nonExistentExists).toBe(false);
    });
  });

  describe('page utilities', () => {
    let pageUtilsPage: Page | null = null;
    
    beforeEach(async () => {
      const html = createTestHtml('Page Utils Test');
      pageUtilsPage = await createTestPageWithContent(html, 'page-utils-test');
    });
    
    afterEach(async () => {
      if (pageUtilsPage) {
        await safeClosePage(pageUtilsPage);
        pageUtilsPage = null;
      }
    });

    it('should get current URL', async () => {
      const url = await getCurrentUrl(pageUtilsPage!);
      expect(url).toMatch(/^data:text\/html/);
    });

    it('should take screenshot as base64', async () => {
      const screenshot = await takeScreenshotBase64(pageUtilsPage!);
      expect(screenshot).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 pattern
      expect(screenshot.length).toBeGreaterThan(0);
    });

    it('should execute JavaScript in page context', async () => {
      const result = await executeScript(pageUtilsPage!, 'document.title');
      expect(result).toBe('Page Utils Test');
      
      const mathResult = await executeScript<number>(pageUtilsPage!, '2 + 2');
      expect(mathResult).toBe(4);
    });
  });

  describe('createTestHtml', () => {
    it('should create basic HTML without console script', () => {
      const html = createTestHtml('Basic Test');
      
      expect(html).toContain('<title>Basic Test</title>');
      expect(html).toContain('<h1>Basic Test</h1>');
      expect(html).toContain('id="test-button"');
      expect(html).not.toContain('<script>');
    });

    it('should create HTML with console script when requested', () => {
      const html = createTestHtml('Console Test', true);
      
      expect(html).toContain('<title>Console Test</title>');
      expect(html).toContain('<h1>Console Test</h1>');
      expect(html).toContain('<script>');
      expect(html).toContain('console.log');
      expect(html).toContain('function testClick()');
    });
  });

  describe('safeClosePage', () => {
    it('should safely close a page without throwing', async () => {
      const html = '<h1>Close Test</h1>';
      testPage = await createTestPageWithContent(html, 'close-test');
      
      // Should not throw
      await safeClosePage(testPage);
      expect(testPage.isClosed()).toBe(true);
      
      // Should not throw even if already closed
      await safeClosePage(testPage);
      
      testPage = null; // Prevent double cleanup in afterEach
    });
  });
});