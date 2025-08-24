import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTestContext } from '../test-utils/TestContext.js';
import { PuppeteerMcpServer } from '../PuppeteerMcpServer.js';
import { Browser, Page } from 'puppeteer-core';

describe('PuppeteerMcpServer Error Path Coverage', () => {
  describe('Tool Error Handling', () => {
    it('should handle list_tab_urls browser.pages() failure', async () => {
      await withTestContext('list-tabs-error-test', async (context) => {
        // Mock server context pages() to throw an error
        const server = context.server as any;
        const originalContext = server.context;
        server.context = {
          pages: vi.fn().mockRejectedValue(new Error('Browser pages failed'))
        };

        try {
          const result = await context.client.callTool('list_tab_urls', {});
          
          expect(result.isError).toBe(true);
          expect(result.content[0].text).toContain('Failed to list tab URLs: Browser pages failed');
        } finally {
          // Restore original context
          server.context = originalContext;
        }
      });
    });

    it('should handle list_tab_urls with non-Error object', async () => {
      await withTestContext('list-tabs-non-error-test', async (context) => {
        // Mock server context pages() to throw a non-Error object
        const server = context.server as any;
        const originalContext = server.context;
        server.context = {
          pages: vi.fn().mockRejectedValue('String error message')
        };

        try {
          const result = await context.client.callTool('list_tab_urls', {});
          
          expect(result.isError).toBe(true);
          expect(result.content[0].text).toContain('Failed to list tab URLs: String error message');
        } finally {
          // Restore original context
          server.context = originalContext;
        }
      });
    });

    it('should handle take_screenshot page.screenshot() failure', async () => {
      await withTestContext('screenshot-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock page.screenshot() to throw an error
        const server = context.server as any;
        const originalScreenshot = server.page.screenshot;
        server.page.screenshot = vi.fn().mockRejectedValue(new Error('Screenshot failed'));

        try {
          const result = await context.client.callTool('take_screenshot', {});
          
          expect(result.content[0].text).toContain('screenshot capture failed: Screenshot failed');
          expect(result.isError).toBe(true);
        } finally {
          // Restore original method
          server.page.screenshot = originalScreenshot;
        }
      });
    });

    it('should handle take_screenshot with non-Error object', async () => {
      await withTestContext('screenshot-non-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock page.screenshot() to throw a non-Error object
        const server = context.server as any;
        const originalScreenshot = server.page.screenshot;
        server.page.screenshot = vi.fn().mockRejectedValue('Screenshot string error');

        try {
          const result = await context.client.callTool('take_screenshot', {});
          
          expect(result.content[0].text).toContain('screenshot capture failed: Screenshot string error');
          expect(result.isError).toBe(true);
        } finally {
          // Restore original method
          server.page.screenshot = originalScreenshot;
        }
      });
    });

    it('should handle get_html page.content() failure', async () => {
      await withTestContext('html-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock page.content() to throw an error
        const server = context.server as any;
        const originalContent = server.page.content;
        server.page.content = vi.fn().mockRejectedValue(new Error('Content extraction failed'));

        try {
          const result = await context.client.callTool('get_html', {});
          
          expect(result.content[0].text).toContain('HTML extraction failed: Content extraction failed');
          expect(result.isError).toBe(true);
        } finally {
          // Restore original method
          server.page.content = originalContent;
        }
      });
    });

    it('should handle get_html with non-Error object', async () => {
      await withTestContext('html-non-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock page.content() to throw a non-Error object
        const server = context.server as any;
        const originalContent = server.page.content;
        server.page.content = vi.fn().mockRejectedValue('HTML string error');

        try {
          const result = await context.client.callTool('get_html', {});
          
          expect(result.content[0].text).toContain('HTML extraction failed: HTML string error');
          expect(result.isError).toBe(true);
        } finally {
          // Restore original method
          server.page.content = originalContent;
        }
      });
    });

    it('should handle get_console internal error', async () => {
      await withTestContext('console-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock the consoleLogs property to cause an error when accessed
        const server = context.server as any;
        const originalConsoleLogs = server.consoleLogs;
        
        // Create a property that throws when accessed
        Object.defineProperty(server, 'consoleLogs', {
          get: () => {
            throw new Error('Console logs access failed');
          },
          configurable: true
        });

        try {
          const result = await context.client.callTool('get_console', { clear: false });
          
          expect(result.content[0].text).toContain('console output retrieval failed: Console logs access failed');
          expect(result.isError).toBe(true);
        } finally {
          // Restore original property
          Object.defineProperty(server, 'consoleLogs', {
            value: originalConsoleLogs,
            writable: true,
            configurable: true
          });
        }
      });
    });

    it('should handle get_console with non-Error object', async () => {
      await withTestContext('console-non-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock the consoleLogs property to cause a non-Error when accessed
        const server = context.server as any;
        const originalConsoleLogs = server.consoleLogs;
        
        // Create a property that throws a non-Error when accessed
        Object.defineProperty(server, 'consoleLogs', {
          get: () => {
            throw 'Console string error';
          },
          configurable: true
        });

        try {
          const result = await context.client.callTool('get_console', { clear: false });
          
          expect(result.content[0].text).toContain('console output retrieval failed: Console string error');
          expect(result.isError).toBe(true);
        } finally {
          // Restore original property
          Object.defineProperty(server, 'consoleLogs', {
            value: originalConsoleLogs,
            writable: true,
            configurable: true
          });
        }
      });
    });
  });

  describe('Page Cleanup Error Handling', () => {
    it('should handle page.close() failure in disconnect method', async () => {
      await withTestContext('disconnect-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock page.close() to throw an error
        const server = context.server as any;
        const originalClose = server.page.close;
        server.page.close = vi.fn().mockRejectedValue(new Error('Close failed'));

        // Spy on console.error to verify error logging
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          // Call disconnect directly to test error handling
          await server.disconnect();
          
          // Verify that console.error was called with the expected message
          // Implementation logs stringified error messages
          expect(consoleErrorSpy).toHaveBeenCalledWith('Error closing page:', 'Close failed');
          
          // Page should be cleared even if close() fails to ensure idempotency
          expect(server.page).toBeNull();
        } finally {
          // Restore console
          consoleErrorSpy.mockRestore();
        }
      });
    });

    it('should handle page.close() failure with non-Error object', async () => {
      await withTestContext('disconnect-non-error-test', async (context) => {
        // First navigate to create a page
        await context.client.callTool('navigate', { url: 'data:text/html,<h1>Test</h1>' });
        
        // Mock page.close() to throw a non-Error object
        const server = context.server as any;
        const originalClose = server.page.close;
        server.page.close = vi.fn().mockRejectedValue('Close string error');

        // Spy on console.error to verify error logging
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        try {
          // Call disconnect directly to test error handling
          await server.disconnect();
          
          // Verify that console.error was called with the expected message
          expect(consoleErrorSpy).toHaveBeenCalledWith('Error closing page:', 'Close string error');
          
          // Page should be cleared even if close() fails to ensure idempotency
          expect(server.page).toBeNull();
        } finally {
          // Restore console
          consoleErrorSpy.mockRestore();
        }
      });
    });
  });
});
