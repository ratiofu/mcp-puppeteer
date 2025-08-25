import { describe, it, expect } from 'vitest';
import { withTestContext } from '../test-utils/TestContext.js';
import { interactiveHtml, page2Html } from '../test-utils/test-fixtures.js';
import { TOOL_NAMES, type ScreenshotResponse } from '../types/api.js';

describe('Screenshot Tool', () => {
  describe('Valid Screenshot Capture', () => {
    it('should capture screenshot and return base64 encoded PNG', async () => {
      await withTestContext('screenshot-basic', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Take a screenshot
        const result = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;

        // Verify successful screenshot
        expect(result.isError).toBe(false);
        expect(result.content).toHaveLength(1);
        
        const content = result.content[0];
        expect(content.type).toBe('image');
        
        // Verify it's a base64 encoded image
        if (content.type === 'image') {
          expect(content.data).toBeDefined();
          expect(typeof content.data).toBe('string');
          expect(content.data.length).toBeGreaterThan(0);
          expect(content.mimeType).toBe('image/png');
          
          // Verify it's valid base64
          expect(() => Buffer.from(content.data, 'base64')).not.toThrow();
          
          // Verify the base64 data represents a PNG (starts with PNG signature when decoded)
          const buffer = Buffer.from(content.data, 'base64');
          expect(buffer.length).toBeGreaterThan(8);
          // PNG signature: 89 50 4E 47 0D 0A 1A 0A
          expect(buffer[0]).toBe(0x89);
          expect(buffer[1]).toBe(0x50);
          expect(buffer[2]).toBe(0x4E);
          expect(buffer[3]).toBe(0x47);
        }
      });
    });

    it('should capture screenshots of different page states', async () => {
      await withTestContext('screenshot-different-states', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Take initial screenshot
        const initialScreenshot = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;
        expect(initialScreenshot.isError).toBe(false);
        
        const initialContent = initialScreenshot.content[0];
        expect(initialContent.type).toBe('image');

        // Click a button to change page state
        await context.client.click('#test-button');

        // Take screenshot after interaction
        const afterClickScreenshot = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;
        expect(afterClickScreenshot.isError).toBe(false);
        
        const afterClickContent = afterClickScreenshot.content[0];
        expect(afterClickContent.type).toBe('image');

        // Screenshots should be different (different base64 data)
        if (initialContent.type === 'image' && afterClickContent.type === 'image') {
          expect(initialContent.data).not.toBe(afterClickContent.data);
        }
      });
    });

    it('should capture screenshots of different page sizes', async () => {
      await withTestContext('screenshot-different-sizes', async (context) => {
        // Create pages with different content sizes
        const smallPageHtml = `
<!DOCTYPE html>
<html>
<head><title>Small Page</title></head>
<body style="width: 300px; height: 200px; background: red;">
  <h1>Small Page</h1>
</body>
</html>`;

        const largePageHtml = `
<!DOCTYPE html>
<html>
<head><title>Large Page</title></head>
<body style="width: 1200px; height: 800px; background: blue;">
  <h1>Large Page</h1>
  <div style="height: 600px; background: linear-gradient(to bottom, blue, green);">
    <p>This is a large page with lots of content</p>
  </div>
</body>
</html>`;

        await context.webServer.addResources([
          {
            path: '/small',
            body: smallPageHtml,
            contentType: 'text/html'
          },
          {
            path: '/large',
            body: largePageHtml,
            contentType: 'text/html'
          }
        ]);

        // Screenshot small page
        await context.client.navigate(context.webServer.getUrl('/small'));
        const smallScreenshot = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;
        expect(smallScreenshot.isError).toBe(false);

        // Screenshot large page
        await context.client.navigate(context.webServer.getUrl('/large'));
        const largeScreenshot = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;
        expect(largeScreenshot.isError).toBe(false);

        // Both should be valid PNG images
        const smallContent = smallScreenshot.content[0];
        const largeContent = largeScreenshot.content[0];
        
        if (smallContent.type === 'image' && largeContent.type === 'image') {
          expect(smallContent.mimeType).toBe('image/png');
          expect(largeContent.mimeType).toBe('image/png');
          
          // Screenshots should be different
          expect(smallContent.data).not.toBe(largeContent.data);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when no page is available', async () => {
      await withTestContext('screenshot-no-page', async (context) => {
        // Try to take screenshot without navigating to any page first
        const result = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;

        // Verify error response
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);
        
        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toBe('no current page to screenshot');
      });
    });

    it('should handle screenshot failures gracefully', async () => {
      await withTestContext('screenshot-failure', async (context) => {
        // Add page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Close the page to simulate a failure condition
        await context.server.disconnect();

        // Try to take screenshot after page is closed
        const result = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;

        // Should return error
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);
        
        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toBe('no current page to screenshot');
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response matching ScreenshotResponse interface', async () => {
      await withTestContext('screenshot-response-format', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Take a screenshot
        const result = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;

        // Verify response structure matches ScreenshotResponse interface
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('isError');
        expect(Array.isArray(result.content)).toBe(true);
        expect(typeof result.isError).toBe('boolean');
        
        // Verify content structure for successful screenshot
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content).toHaveProperty('type');
        expect(content.type).toBe('image');
        
        if (content.type === 'image') {
          expect(content).toHaveProperty('data');
          expect(content).toHaveProperty('mimeType');
          expect(typeof content.data).toBe('string');
          expect(content.mimeType).toBe('image/png');
        }
      });
    });

    it('should return consistent error response format', async () => {
      await withTestContext('screenshot-error-format', async (context) => {
        // Try to take screenshot without a page
        const result = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;

        // Verify error response structure
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('isError');
        expect(result.isError).toBe(true);
        expect(Array.isArray(result.content)).toBe(true);
        expect(result.content).toHaveLength(1);
        
        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(typeof content.text).toBe('string');
        if (content.type === 'text') {
          expect(content.text.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Image Format and MIME Type Verification', () => {
    it('should always return PNG format with correct MIME type', async () => {
      await withTestContext('screenshot-png-format', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Take multiple screenshots
        for (let i = 0; i < 3; i++) {
          const result = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;
          
          expect(result.isError).toBe(false);
          
          const content = result.content[0];
          expect(content.type).toBe('image');
          
          if (content.type === 'image') {
            // Verify MIME type is always PNG
            expect(content.mimeType).toBe('image/png');
            
            // Verify PNG signature in decoded data
            const buffer = Buffer.from(content.data, 'base64');
            expect(buffer[0]).toBe(0x89); // PNG signature byte 1
            expect(buffer[1]).toBe(0x50); // PNG signature byte 2 ('P')
            expect(buffer[2]).toBe(0x4E); // PNG signature byte 3 ('N')
            expect(buffer[3]).toBe(0x47); // PNG signature byte 4 ('G')
          }
        }
      });
    });

    it('should produce valid base64 encoded data', async () => {
      await withTestContext('screenshot-base64-validation', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1 style="color: red;">Base64 Test</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Take a screenshot
        const result = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;
        
        expect(result.isError).toBe(false);
        
        const content = result.content[0];
        if (content.type === 'image') {
          const base64Data = content.data;
          
          // Verify base64 format (should only contain valid base64 characters)
          expect(base64Data).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
          
          // Verify it can be decoded without errors
          expect(() => {
            const buffer = Buffer.from(base64Data, 'base64');
            expect(buffer.length).toBeGreaterThan(0);
          }).not.toThrow();
          
          // Verify the decoded data has reasonable size (not empty, not too small)
          const buffer = Buffer.from(base64Data, 'base64');
          expect(buffer.length).toBeGreaterThan(100); // PNG files are typically larger than 100 bytes
        }
      });
    });
  });

  describe('Screenshot Consistency', () => {
    it('should produce consistent screenshots for identical page states', async () => {
      await withTestContext('screenshot-consistency', async (context) => {
        // Create a simple, static page
        const staticPageHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Static Test Page</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial; background: white; }
        h1 { color: blue; }
    </style>
</head>
<body>
    <h1>Static Content</h1>
    <p>This page has no dynamic content or animations.</p>
</body>
</html>`;

        await context.webServer.addResource({
          path: '/',
          body: staticPageHtml,
          contentType: 'text/html'
        });

        // Navigate and take first screenshot
        await context.client.navigate(context.webServer.getUrl('/'));
        const screenshot1 = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;
        
        // Take second screenshot immediately
        const screenshot2 = await context.client.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {}) as ScreenshotResponse;

        // Both should be successful
        expect(screenshot1.isError).toBe(false);
        expect(screenshot2.isError).toBe(false);

        // Screenshots of identical static content should be the same
        const content1 = screenshot1.content[0];
        const content2 = screenshot2.content[0];
        
        if (content1.type === 'image' && content2.type === 'image') {
          expect(content1.data).toBe(content2.data);
        }
      });
    });
  });
});