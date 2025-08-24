import { describe, it, expect } from 'vitest';
import { withTestContext } from '../test-utils/TestContext.js';
import { interactiveHtml, page2Html } from '../test-utils/test-fixtures.js';
import { ListTabUrlsResponse, TOOL_NAMES } from '../types/api.js';

describe('List Tab URLs Tool', () => {
  describe('Valid Tab URL Listing', () => {
    it('should list tab URLs functionality', async () => {
      await withTestContext('list-tabs-basic', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // List tab URLs
        const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;

        // Verify successful tab listing
        expect(result.isError).toBe(false);
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content.type).toBe('text');
        
        const tabUrls = content.text;
        expect(tabUrls).toContain('Current tab URLs:');
        expect(tabUrls).toContain(context.webServer.getUrl('/'));
      });
    });

    it('should list URLs with multiple tabs open in the same browser instance', async () => {
      await withTestContext('list-tabs-multiple', async (context) => {
        // Add multiple pages (web server auto-starts)
        await context.webServer.addResources([
          {
            path: '/page1',
            body: interactiveHtml,
            contentType: 'text/html'
          },
          {
            path: '/page2',
            body: page2Html,
            contentType: 'text/html'
          }
        ]);

        // Navigate to first page
        await context.client.navigate(context.webServer.getUrl('/page1'));

        // List tab URLs after first navigation
        const result1 = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(result1.isError).toBe(false);
        expect(result1.content[0].text).toContain(context.webServer.getUrl('/page1'));

        // Navigate to second page (same tab)
        await context.client.navigate(context.webServer.getUrl('/page2'));

        // List tab URLs after second navigation
        const result2 = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(result2.isError).toBe(false);
        expect(result2.content[0].text).toContain(context.webServer.getUrl('/page2'));
        
        // Should not contain the first URL anymore since we navigated in the same tab
        expect(result2.content[0].text).not.toContain(context.webServer.getUrl('/page1'));
      });
    });

    it('should verify URL format and completeness in responses', async () => {
      await withTestContext('list-tabs-url-format', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/test-page',
          body: '<h1>Test Page for URL Format</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/test-page'));

        // List tab URLs
        const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;

        expect(result.isError).toBe(false);
        const content = result.content[0];
        const tabUrls = content.text;
        
        // Verify URL format is complete and correct
        const expectedUrl = context.webServer.getUrl('/test-page');
        expect(tabUrls).toContain(expectedUrl);
        
        // Verify it's a proper HTTP URL
        expect(expectedUrl).toMatch(/^http:\/\/localhost:\d+\/test-page$/);
        expect(tabUrls).toContain('http://localhost:');
      });
    });

    it('should handle navigation between different pages', async () => {
      await withTestContext('list-tabs-navigation', async (context) => {
        // Add multiple pages (web server auto-starts)
        await context.webServer.addResources([
          {
            path: '/home',
            body: '<h1>Home Page</h1><a href="/about">About</a>',
            contentType: 'text/html'
          },
          {
            path: '/about',
            body: '<h1>About Page</h1><a href="/contact">Contact</a>',
            contentType: 'text/html'
          },
          {
            path: '/contact',
            body: '<h1>Contact Page</h1>',
            contentType: 'text/html'
          }
        ]);

        // Navigate through different pages
        const pages = ['/home', '/about', '/contact'];
        
        for (const page of pages) {
          await context.client.navigate(context.webServer.getUrl(page));
          
          const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
          expect(result.isError).toBe(false);
          // The result should contain the current page URL among all browser tabs
          const content = result.content[0];
          expect(content.text).toContain(context.webServer.getUrl(page));
        }
      });
    }, 15000); // Increase timeout for this test
  });

  describe('Session Isolation', () => {
    it('should test session isolation between different test instances', async () => {
      // This test verifies that different test contexts have isolated sessions
      // We'll run two separate test contexts and verify they don't interfere
      
      const testResults: string[] = [];
      
      // First test context
      await withTestContext('list-tabs-session-1', async (context1) => {
        await context1.webServer.addResource({
          path: '/session1',
          body: '<h1>Session 1 Page</h1>',
          contentType: 'text/html'
        });
        await context1.client.navigate(context1.webServer.getUrl('/session1'));
        
        const result1 = await context1.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(result1.isError).toBe(false);
        testResults.push(result1.content[0].text);
      });

      // Second test context
      await withTestContext('list-tabs-session-2', async (context2) => {
        await context2.webServer.addResource({
          path: '/session2',
          body: '<h1>Session 2 Page</h1>',
          contentType: 'text/html'
        });
        await context2.client.navigate(context2.webServer.getUrl('/session2'));
        
        const result2 = await context2.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(result2.isError).toBe(false);
        testResults.push(result2.content[0].text);
      });

      // Verify sessions were isolated
      expect(testResults).toHaveLength(2);
      expect(testResults[0]).toContain('/session1');
      expect(testResults[0]).not.toContain('/session2');
      expect(testResults[1]).toContain('/session2');
      expect(testResults[1]).not.toContain('/session1');
    });

    it('should maintain separate tab states across test instances', async () => {
      // Test that each test context maintains its own tab state
      const sessionData: Array<{ sessionId: string; url: string }> = [];

      // Create multiple test contexts with different pages
      for (let i = 1; i <= 3; i++) {
        await withTestContext(`list-tabs-isolation-${i}`, async (context) => {
          await context.webServer.addResource({
            path: `/page${i}`,
            body: `<h1>Page ${i}</h1>`,
            contentType: 'text/html'
          });
          await context.client.navigate(context.webServer.getUrl(`/page${i}`));
          
          const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
          expect(result.isError).toBe(false);
          
          const content = result.content[0];
          sessionData.push({
            sessionId: context.sessionId,
            url: content.text
          });
        });
      }

      // Verify each session had its own isolated state
      expect(sessionData).toHaveLength(3);
      sessionData.forEach((data, index) => {
        expect(data.url).toContain(`/page${index + 1}`);
        expect(data.sessionId).toContain(`list-tabs-isolation-${index + 1}`);
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response matching ListTabUrlsResponse interface', async () => {
      await withTestContext('list-tabs-response-format', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // List tab URLs
        const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;

        // Verify response structure matches ListTabUrlsResponse interface
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('isError');
        expect(Array.isArray(result.content)).toBe(true);
        expect(typeof result.isError).toBe('boolean');
        
        // Verify content structure for successful tab listing
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content).toHaveProperty('type');
        expect(content).toHaveProperty('text');
        expect(content.type).toBe('text');
        expect(typeof content.text).toBe('string');
      });
    });

    it('should return consistent response format for different scenarios', async () => {
      await withTestContext('list-tabs-consistent-format', async (context) => {
        // Test with no navigation first
        const resultEmpty = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(resultEmpty.isError).toBe(false);
        expect(resultEmpty.content).toHaveLength(1);
        expect(resultEmpty.content[0].type).toBe('text');

        // Test after navigation
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        const resultWithPage = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(resultWithPage.isError).toBe(false);
        expect(resultWithPage.content).toHaveLength(1);
        expect(resultWithPage.content[0].type).toBe('text');

        // Both should have the same response structure
        expect(typeof resultEmpty.isError).toBe(typeof resultWithPage.isError);
        expect(Array.isArray(resultEmpty.content)).toBe(Array.isArray(resultWithPage.content));
      });
    });
  });

  describe('Tab State Management', () => {
    it('should reflect current tab state accurately', async () => {
      await withTestContext('list-tabs-state-accuracy', async (context) => {
        // Initially, there might be no tabs or a blank tab
        const initialResult = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(initialResult.isError).toBe(false);

        // Add resource and navigate
        await context.webServer.addResource({
          path: '/current-state',
          body: '<h1>Current State Test</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/current-state'));

        // Should now show the navigated URL
        const afterNavResult = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(afterNavResult.isError).toBe(false);
        const afterNavContent = afterNavResult.content[0];
        expect(afterNavContent.text).toContain('/current-state');
      });
    });

    it('should handle rapid navigation changes', async () => {
      await withTestContext('list-tabs-rapid-navigation', async (context) => {
        // Set up multiple pages (web server auto-starts)
        const pages = ['/page1', '/page2', '/page3', '/page4'];
        
        for (const page of pages) {
          await context.webServer.addResource({
            path: page,
            body: `<h1>Page ${page}</h1>`,
            contentType: 'text/html'
          });
        }

        // Navigate rapidly between pages
        for (const page of pages) {
          await context.client.navigate(context.webServer.getUrl(page));
          
          const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
          expect(result.isError).toBe(false);
          const content = result.content[0];
          expect(content.text).toContain(page);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle browser state gracefully', async () => {
      await withTestContext('list-tabs-browser-state', async (context) => {
        // List tabs before any navigation
        const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;

        // Should not error, even with no specific page loaded
        expect(result.isError).toBe(false);
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toContain('Current tab URLs:');
      });
    });

    it('should handle browser disconnection gracefully', async () => {
      await withTestContext('list-tabs-disconnection', async (context) => {
        // Add page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Verify normal operation
        const normalResult = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        expect(normalResult.isError).toBe(false);

        // Close the page to simulate disconnection
        await context.server.disconnect();

        // List tabs after disconnection - should handle gracefully
        const afterDisconnectResult = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;
        
        // The behavior may vary, but it should not crash
        expect(afterDisconnectResult).toHaveProperty('isError');
        expect(afterDisconnectResult).toHaveProperty('content');
        expect(Array.isArray(afterDisconnectResult.content)).toBe(true);
      });
    });
  });

  describe('URL Content Validation', () => {
    it('should list complete and valid URLs', async () => {
      await withTestContext('list-tabs-url-validation', async (context) => {
        // Add resource with specific path (web server auto-starts)
        await context.webServer.addResource({
          path: '/validation-test',
          body: '<h1>URL Validation Test</h1>',
          contentType: 'text/html'
        });
        
        const expectedUrl = context.webServer.getUrl('/validation-test');
        await context.client.navigate(expectedUrl);

        // List tab URLs
        const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;

        expect(result.isError).toBe(false);
        const content = result.content[0];
        const tabUrls = content.text;
        
        // Verify the URL is complete and valid
        expect(tabUrls).toContain(expectedUrl);
        expect(expectedUrl).toMatch(/^http:\/\/localhost:\d+\/validation-test$/);
        
        // Verify the response format contains our URL (may contain other URLs from shared browser)
        expect(tabUrls).toContain('Current tab URLs:');
        expect(tabUrls).toContain(expectedUrl);
      });
    });

    it('should handle special characters in URLs', async () => {
      await withTestContext('list-tabs-special-chars', async (context) => {
        // Add resource with special characters (web server auto-starts)
        await context.webServer.addResource({
          path: '/test-page?param=value&other=123',
          body: '<h1>Special Characters Test</h1>',
          contentType: 'text/html'
        });
        
        const urlWithParams = context.webServer.getUrl('/test-page?param=value&other=123');
        await context.client.navigate(urlWithParams);

        // List tab URLs
        const result = await context.client.callTool(TOOL_NAMES.LIST_TAB_URLS, {}) as ListTabUrlsResponse;

        expect(result.isError).toBe(false);
        const content = result.content[0];
        const tabUrls = content.text;
        
        // Should contain the URL with parameters
        expect(tabUrls).toContain('test-page?param=value&other=123');
      });
    });
  });
});