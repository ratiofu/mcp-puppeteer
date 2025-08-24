import { describe, it, expect } from 'vitest';
import { withTestContext } from '../test-utils/TestContext.js';
import { interactiveHtml } from '../test-utils/test-fixtures.js';
import { ClickResponse, TOOL_NAMES } from '../types/api.js';

describe('Click Tool', () => {
  describe('Valid Element Clicking', () => {
    it('should click elements using CSS selectors', async () => {
      await withTestContext('click-css-selector', async (context) => {
        // Add interactive test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });

        // Navigate to the test page first
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click the test button
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#test-button'
        }) as ClickResponse;

        // Verify successful click
        expect(result.isError).toBe(false);
        expect(result.content).toHaveLength(1);

        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toContain('Clicked on #test-button');
      });
    });

    it('should click different element types (buttons)', async () => {
      await withTestContext('click-button-elements', async (context) => {
        // Add interactive test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });

        // Navigate to the test page
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click different buttons
        const buttons = ['#test-button', '#console-button', '#error-button'];

        for (const buttonSelector of buttons) {
          const result = await context.client.callTool(TOOL_NAMES.CLICK, {
            selector: buttonSelector
          }) as ClickResponse;

          expect(result.isError).toBe(false);
          const content = result.content[0];
          expect(content.text).toContain(`Clicked on ${buttonSelector}`);
        }
      });
    });

    it('should click different element types (links)', async () => {
      await withTestContext('click-link-elements', async (context) => {
        // Add interactive test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });

        // Navigate to the test page
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click the navigation link
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#navigation-link'
        }) as ClickResponse;

        expect(result.isError).toBe(false);
        const content = result.content[0];
        expect(content.text).toContain('Clicked on #navigation-link');
      });
    });

    it('should click different element types (inputs)', async () => {
      await withTestContext('click-input-elements', async (context) => {
        // Add interactive test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });

        // Navigate to the test page
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click the text input
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#text-input'
        }) as ClickResponse;

        expect(result.isError).toBe(false);
        const content = result.content[0];
        expect(content.text).toContain('Clicked on #text-input');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when no page is available', async () => {
      await withTestContext('click-no-page', async (context) => {
        // Try to click without navigating to any page first
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#test-button'
        }) as ClickResponse;

        // Verify error response
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);

        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toBe('no current page to click');
      });
    });

    it('should handle invalid selectors', async () => {
      await withTestContext('click-invalid-selector', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Try to click a non-existent element
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#non-existent-element'
        }) as ClickResponse;

        // Verify error response
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);

        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toContain('click operation failed');
      });
    });

    it('should handle malformed CSS selectors', async () => {
      await withTestContext('click-malformed-selector', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Try to click with a malformed selector
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '###invalid[[[selector'
        }) as ClickResponse;

        // Verify error response
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);

        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toContain('click operation failed');
      });
    });

    it('should handle elements that are not clickable', async () => {
      await withTestContext('click-non-clickable', async (context) => {
        // Create a page with hidden/disabled elements
        const htmlWithHiddenElements = `
<!DOCTYPE html>
<html>
<head>
    <title>Hidden Elements Test</title>
    <style>
        .hidden { display: none; }
        .disabled { pointer-events: none; }
    </style>
</head>
<body>
    <div id="hidden-element" class="hidden">Hidden Element</div>
    <div id="disabled-element" class="disabled">Disabled Element</div>
</body>
</html>`;

        await context.webServer.addResource({
          path: '/',
          body: htmlWithHiddenElements,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Try to click a hidden element
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#hidden-element'
        }) as ClickResponse;

        // This might succeed or fail depending on Puppeteer's behavior
        // We just verify the response format is correct
        expect(result).toHaveProperty('isError');
        expect(result).toHaveProperty('content');
        expect(Array.isArray(result.content)).toBe(true);
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content.type).toBe('text');
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response matching ClickResponse interface', async () => {
      await withTestContext('click-response-format', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click a button
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#test-button'
        }) as ClickResponse;

        // Verify response structure matches ClickResponse interface
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('isError');
        expect(Array.isArray(result.content)).toBe(true);
        expect(typeof result.isError).toBe('boolean');

        // Verify content structure
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content).toHaveProperty('type');
        expect(content).toHaveProperty('text');
        expect(content.type).toBe('text');
        expect(typeof content.text).toBe('string');
      });
    });

    it('should return consistent error response format', async () => {
      await withTestContext('click-error-format', async (context) => {
        // Try to click without a page
        const result = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#test-button'
        }) as ClickResponse;

        // Verify error response structure
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('isError');
        expect(result.isError).toBe(true);
        expect(Array.isArray(result.content)).toBe(true);
        expect(result.content).toHaveLength(1);

        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(typeof content.text).toBe('string');
        expect(content.text.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Click Interaction Effects', () => {
    it('should verify click effects on page content', async () => {
      await withTestContext('click-effects', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click the test button
        const clickResult = await context.client.callTool(TOOL_NAMES.CLICK, {
          selector: '#test-button'
        }) as ClickResponse;

        expect(clickResult.isError).toBe(false);

        // Get the HTML to verify the click had an effect
        const htmlResult = await context.client.getHtml();
        expect(htmlResult.isError).toBe(false);

        // The interactive page should show "Button clicked 1 times" after clicking
        const htmlContent = htmlResult.content[0];
        expect(htmlContent.text).toContain('Button clicked 1 times');
      });
    });

    it('should handle multiple clicks on the same element', async () => {
      await withTestContext('click-multiple', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click the test button multiple times
        for (let i = 1; i <= 3; i++) {
          const clickResult = await context.client.callTool(TOOL_NAMES.CLICK, {
            selector: '#test-button'
          }) as ClickResponse;

          expect(clickResult.isError).toBe(false);
          const clickContent = clickResult.content[0];
          expect(clickContent.text).toContain('Clicked on #test-button');
        }

        // Verify the final state shows 3 clicks
        const htmlResult = await context.client.getHtml();
        const htmlContent = htmlResult.content[0];
        expect(htmlContent.text).toContain('Button clicked 3 times');
      });
    });
  });
});