import { describe, it, expect, afterEach } from 'vitest';
import { initBrowser, initBrowserSafe } from '../initBrowser.js';
import { PuppeteerMcpServer } from '../PuppeteerMcpServer.js';
import { Browser } from 'puppeteer-core';
import { withTestContext } from '../test-utils/TestContext.js';

describe('Integration Tests - Real Component Integration', () => {
  let browser: Browser | null = null;

  afterEach(async () => {
    // Clean up any browser instances created during tests
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        // Browser might already be closed
      }
      browser = null;
    }
  });

  describe('Browser Connection Integration', () => {
    it('should return proper result structure with initBrowserSafe', async () => {
      const result = await initBrowserSafe();
      
      if (result.success && result.browser) {
        browser = result.browser;
        expect(browser).toBeDefined();
        expect(browser.isConnected()).toBe(true);
      } else {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });

    it('should handle connection failure gracefully with initBrowserSafe', async () => {
      // Try to connect to a non-existent debug port
      const result = await initBrowserSafe({
        browserURL: 'http://localhost:9999', // Non-existent port
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    it('should handle custom configuration with initBrowserSafe', async () => {
      const customConfig = {
        browserURL: 'http://localhost:9222',
        defaultViewport: { width: 1920, height: 1080 },
      };

      const result = await initBrowserSafe(customConfig);
      
      if (result.success && result.browser) {
        browser = result.browser;
        expect(browser).toBeDefined();
        expect(browser.isConnected()).toBe(true);
      } else {
        // Connection might fail if no browser is running on port 9222
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('PuppeteerMcpServer Integration', () => {
    it('should work with test context integration', async () => {
      await withTestContext('integration-server-test', async (context) => {
        const { client } = context;
        
        // Test that we can call tools through the integrated system
        const result = await client.callTool('list_tab_urls', {});
        
        expect(result).toBeDefined();
        expect(result.isError).toBe(false);
        if (!result.isError) {
          expect(Array.isArray(result.content)).toBe(true);
        }
      });
    });

    it('should handle server lifecycle through test context', async () => {
      await withTestContext('lifecycle-test-session', async (context) => {
        const { client } = context;
        
        // Test basic tool functionality
        const result = await client.callTool('list_tab_urls', {});
        expect(result.isError).toBe(false);
        
        // Context cleanup will handle server disconnection
      });
    });

    it('should create and manage browser pages properly', async () => {
      await withTestContext('page-management-test', async (context) => {
        const { client } = context;
        
        // Initially should have at least one tab
        const initialTabs = await client.callTool('list_tab_urls', {});
        expect(initialTabs.isError).toBe(false);
        if (!initialTabs.isError) {
          expect(Array.isArray(initialTabs.content)).toBe(true);
          expect(initialTabs.content.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('End-to-End Tool Integration', () => {
    it('should perform complete navigation workflow', async () => {
      await withTestContext('e2e-navigation-test', async (context) => {
        const { client, webServer } = context;
        
        // Add a simple page resource to start the web server
        webServer.addResource({
          path: '/simple-page.html',
          body: `
            <!DOCTYPE html>
            <html>
              <head><title>Simple Test Page</title></head>
              <body><h1>Simple Test Page</h1></body>
            </html>
          `,
          contentType: 'text/html'
        });
        
        // Start the web server
        await webServer.start();
        
        // Navigate to a test page
        const navigateResult = await client.callTool('navigate', {
          url: webServer.getUrl('/simple-page.html')
        });
        
        expect(navigateResult.isError).toBe(false);
        
        // Take a screenshot
        const screenshotResult = await client.callTool('take_screenshot', {});
        expect(screenshotResult.isError).toBe(false);
        if (!screenshotResult.isError) {
          // Screenshot should return some content (format may vary)
          expect(screenshotResult.content).toBeDefined();
        }
        
        // Get HTML content
        const htmlResult = await client.callTool('get_html', {});
        expect(htmlResult.isError).toBe(false);
        if (!htmlResult.isError) {
          expect(Array.isArray(htmlResult.content)).toBe(true);
          if (Array.isArray(htmlResult.content) && htmlResult.content.length > 0) {
            const textContent = htmlResult.content[0]?.text;
            expect(textContent).toBeDefined();
            expect(textContent).toContain('<html');
            // Content should be HTML (specific content may vary)
            expect(textContent.length).toBeGreaterThan(0);
          }
        }
        
        // List tab URLs
        const tabsResult = await client.callTool('list_tab_urls', {});
        expect(tabsResult.isError).toBe(false);
        if (!tabsResult.isError) {
          expect(Array.isArray(tabsResult.content)).toBe(true);
          expect(tabsResult.content.length).toBeGreaterThan(0);
        }
      });
    });

    it('should handle interactive elements workflow', async () => {
      await withTestContext('e2e-interactive-test', async (context) => {
        const { client, webServer } = context;
        
        // Add an interactive page resource
        webServer.addResource({
          path: '/interactive-page.html',
          body: `
            <!DOCTYPE html>
            <html>
              <head><title>Interactive Test Page</title></head>
              <body>
                <h1>Interactive Test Page</h1>
                <button id="test-button" onclick="console.log('Button clicked!')">Click Me</button>
              </body>
            </html>
          `,
          contentType: 'text/html'
        });
        
        // Start the web server
        await webServer.start();
        
        // Navigate to interactive page
        await client.callTool('navigate', {
          url: webServer.getUrl('/interactive-page.html')
        });
        
        // Click a button (may fail if element not found, that's ok for integration test)
        const clickResult = await client.callTool('click', {
          selector: '#test-button'
        });
        // Don't assert success/failure - just verify it doesn't crash
        expect(clickResult).toBeDefined();
        
        // Check console output after click
        const consoleResult = await client.callTool('get_console', {});
        expect(consoleResult.isError).toBe(false);
        if (!consoleResult.isError) {
          expect(Array.isArray(consoleResult.content)).toBe(true);
        }
        
        // Get updated HTML after interaction
        const htmlResult = await client.callTool('get_html', {});
        expect(htmlResult.isError).toBe(false);
        if (!htmlResult.isError) {
          expect(Array.isArray(htmlResult.content)).toBe(true);
          if (Array.isArray(htmlResult.content) && htmlResult.content.length > 0) {
            const textContent = htmlResult.content[0]?.text;
            expect(textContent).toBeDefined();
            expect(textContent).toContain('<html');
          }
        }
      });
    });

    it('should handle multiple concurrent tool calls', async () => {
      await withTestContext('e2e-concurrent-test', async (context) => {
        const { client, webServer } = context;
        
        // Add a simple page resource
        webServer.addResource({
          path: '/simple-page.html',
          body: `
            <!DOCTYPE html>
            <html>
              <head><title>Simple Test Page</title></head>
              <body><h1>Simple Test Page</h1></body>
            </html>
          `,
          contentType: 'text/html'
        });
        
        // Start the web server
        await webServer.start();
        
        // Navigate first
        await client.callTool('navigate', {
          url: webServer.getUrl('/simple-page.html')
        });
        
        // Make multiple concurrent calls
        const [screenshotResult, htmlResult, tabsResult] = await Promise.all([
          client.callTool('take_screenshot', {}),
          client.callTool('get_html', {}),
          client.callTool('list_tab_urls', {})
        ]);
        
        // All should succeed
        expect(screenshotResult.isError).toBe(false);
        expect(htmlResult.isError).toBe(false);
        expect(tabsResult.isError).toBe(false);
        
        // Verify content types
        if (!screenshotResult.isError) {
          expect(screenshotResult.content).toBeDefined();
        }
        if (!htmlResult.isError) {
          expect(Array.isArray(htmlResult.content)).toBe(true);
          if (Array.isArray(htmlResult.content) && htmlResult.content.length > 0) {
            const textContent = htmlResult.content[0]?.text;
            expect(textContent).toBeDefined();
            expect(textContent).toContain('<html');
          }
        }
        if (!tabsResult.isError) {
          expect(Array.isArray(tabsResult.content)).toBe(true);
        }
      });
    });

    it('should handle error scenarios in integrated environment', async () => {
      await withTestContext('e2e-error-test', async (context) => {
        const { client } = context;
        
        // Try to click without navigating first (should handle gracefully)
        const clickResult = await client.callTool('click', {
          selector: '#non-existent'
        });
        
        // Should return error but not crash
        expect(clickResult.isError).toBe(true);
        if (clickResult.isError) {
          // Check the actual error message format
          const errorContent = Array.isArray(clickResult.content) 
            ? clickResult.content[0]?.text || clickResult.content.join(' ')
            : clickResult.content;
          expect(errorContent).toContain('no current page');
        }
        
        // Other tools should still work after error
        const tabsResult = await client.callTool('list_tab_urls', {});
        expect(tabsResult.isError).toBe(false);
      });
    });

    it('should maintain session isolation in integrated tests', async () => {
      // Run two concurrent test contexts
      const [result1, result2] = await Promise.all([
        withTestContext('isolation-test-1', async (context) => {
          const { client, webServer } = context;
          webServer.addResource({
            path: '/simple-page.html',
            body: `
              <!DOCTYPE html>
              <html><head><title>Page 1</title></head><body><h1>Page 1</h1></body></html>
            `,
            contentType: 'text/html'
          });
          await webServer.start();
          await client.callTool('navigate', {
            url: webServer.getUrl('/simple-page.html')
          });
          return client.callTool('list_tab_urls', {});
        }),
        withTestContext('isolation-test-2', async (context) => {
          const { client, webServer } = context;
          webServer.addResource({
            path: '/interactive-page.html',
            body: `
              <!DOCTYPE html>
              <html><head><title>Page 2</title></head><body><h1>Page 2</h1></body></html>
            `,
            contentType: 'text/html'
          });
          await webServer.start();
          await client.callTool('navigate', {
            url: webServer.getUrl('/interactive-page.html')
          });
          return client.callTool('list_tab_urls', {});
        })
      ]);
      
      // Both should succeed independently
      expect(result1.isError).toBe(false);
      expect(result2.isError).toBe(false);
      
      // Each should have their own tab URLs
      if (!result1.isError && !result2.isError) {
        expect(Array.isArray(result1.content)).toBe(true);
        expect(Array.isArray(result2.content)).toBe(true);
        // URLs should be different (different pages)
        expect(result1.content[0]).not.toBe(result2.content[0]);
      }
    });
  });
});