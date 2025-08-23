import { Page } from 'puppeteer-core';
import { createTestPage } from './test-setup.js';

/**
 * Common test helper functions for browser testing
 */

/**
 * Create a test page and navigate to a data URL with HTML content
 * Useful for testing with inline HTML without needing a web server
 * 
 * @param html HTML content to load
 * @param testName Optional test name for debugging
 * @returns Promise<Page> Page with the HTML content loaded
 */
export async function createTestPageWithContent(html: string, testName?: string): Promise<Page> {
  const page = await createTestPage(testName);
  const dataUrl = `data:text/html,${encodeURIComponent(html)}`;
  await page.goto(dataUrl);
  return page;
}

/**
 * Wait for an element to be present on the page
 * 
 * @param page The page to search on
 * @param selector CSS selector for the element
 * @param timeout Timeout in milliseconds (default: 5_000)
 * @returns Promise<void>
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 5_000): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Wait for page to be fully loaded (including network idle)
 * 
 * @param page The page to wait for
 * @param timeout Timeout in milliseconds (default: 5_000)
 * @returns Promise<void>
 */
export async function waitForPageLoad(page: Page, timeout: number = 5_000): Promise<void> {
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout });
}

/**
 * Get text content of an element
 * 
 * @param page The page to search on
 * @param selector CSS selector for the element
 * @returns Promise<string | null> Text content or null if element not found
 */
export async function getElementText(page: Page, selector: string): Promise<string | null> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element ? element.textContent : null;
  }, selector);
}

/**
 * Check if an element exists on the page
 * 
 * @param page The page to search on
 * @param selector CSS selector for the element
 * @returns Promise<boolean> True if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Get the current page URL
 * 
 * @param page The page to get URL from
 * @returns Promise<string> Current page URL
 */
export async function getCurrentUrl(page: Page): Promise<string> {
  return page.url();
}

/**
 * Take a screenshot and return as base64 string
 * 
 * @param page The page to screenshot
 * @param options Screenshot options
 * @returns Promise<string> Base64 encoded PNG image
 */
export async function takeScreenshotBase64(page: Page, options?: { fullPage?: boolean }): Promise<string> {
  const screenshot = await page.screenshot({ 
    type: 'png', 
    encoding: 'base64',
    fullPage: options?.fullPage ?? false
  });
  return screenshot as string;
}

/**
 * Execute JavaScript in the page context and return the result
 * 
 * @param page The page to execute on
 * @param script JavaScript expression to evaluate
 * @returns Promise<any> Result of the script execution
 */
export async function executeScript<T = any>(page: Page, script: string): Promise<T> {
  return await page.evaluate(new Function(`return ${script}`) as any);
}

/**
 * Clear console logs on the page
 * 
 * @param page The page to clear console on
 * @returns Promise<void>
 */
export async function clearConsole(page: Page): Promise<void> {
  await page.evaluate(() => console.clear());
}

/**
 * Get console logs from the page
 * Note: This requires setting up console listeners before the logs are generated
 * 
 * @param page The page to get console logs from
 * @returns Promise<string[]> Array of console log messages
 */
export async function getConsoleLogs(page: Page): Promise<string[]> {
  // This is a simplified version - in practice, you'd need to set up listeners
  // The actual implementation would depend on how console logging is handled
  return await page.evaluate(() => {
    // This is a placeholder - actual implementation would need proper console capture
    return [];
  });
}

/**
 * Utility to safely close a page with error handling
 * 
 * @param page The page to close
 * @returns Promise<void>
 */
export async function safeClosePage(page: Page): Promise<void> {
  try {
    if (!page.isClosed()) {
      await page.close();
    }
  } catch (error) {
    console.warn('Failed to close page:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Create a simple HTML page with interactive elements for testing
 * 
 * @param title Page title
 * @param includeConsoleScript Whether to include JavaScript that generates console output
 * @returns string HTML content
 */
export function createTestHtml(title: string = 'Test Page', includeConsoleScript: boolean = false): string {
  const consoleScript = includeConsoleScript ? `
    <script>
      console.log('Page loaded: ${title}');
      
      function testClick() {
        console.log('Button clicked');
        document.getElementById('result').textContent = 'Button was clicked!';
      }
      
      function testError() {
        console.error('Test error message');
      }
      
      function testWarn() {
        console.warn('Test warning message');
      }
    </script>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        button { margin: 10px; padding: 10px; }
        #result { margin-top: 20px; padding: 10px; background: #f0f0f0; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <button id="test-button" onclick="testClick()">Click Me</button>
      <button id="error-button" onclick="testError()">Generate Error</button>
      <button id="warn-button" onclick="testWarn()">Generate Warning</button>
      <div id="result">Ready for testing</div>
      <a href="data:text/html,<h1>Second Page</h1>" id="test-link">Navigate to Second Page</a>
      ${consoleScript}
    </body>
    </html>
  `;
}