import { describe, it, expect } from 'vitest';
import { withTestContext } from '../test-utils/TestContext.js';
import { interactiveHtml } from '../test-utils/test-fixtures.js';
import { TOOL_NAMES, type GetConsoleResponse } from '../types/api.js';

describe('Console Tool', () => {
  describe('Valid Console Output Capture', () => {
    it('should capture console output using test pages with JavaScript', async () => {
      await withTestContext('console-basic-capture', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click button that generates console output
        await context.client.click('#console-button');

        // Get console output
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        // Verify console output capture
        expect(result.isError).toBe(false);
        expect(result.content).toHaveLength(1);
        
        const content = result.content[0];
        expect(content.type).toBe('text');
        
        const consoleOutput = content.text;
        expect(consoleOutput).toContain('[log] Test log message');
        expect(consoleOutput).toContain('[warn] Test warning message');
        expect(consoleOutput).toContain('[error] Test error message');
      });
    });

    it('should capture console output from different JavaScript execution contexts', async () => {
      await withTestContext('console-different-contexts', async (context) => {
        // Create a page with various console outputs in different contexts
        const consoleTestHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Console Test</title>
    <script>
        // Console output during page load
        console.log('Page load script executed');
        console.warn('Warning from head script');
    </script>
</head>
<body>
    <h1>Console Test Page</h1>
    <button id="immediate-log" onclick="console.log('Immediate button click')">Immediate Log</button>
    <button id="delayed-log" onclick="setTimeout(() => console.log('Delayed log message'), 50)">Delayed Log</button>
    <button id="error-log" onclick="console.error('Error from button click')">Error Log</button>
    
    <script>
        // Console output after DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM content loaded');
        });
        
        // Immediate console output
        console.log('Body script executed');
    </script>
</body>
</html>`;

        await context.webServer.addResource({
          path: '/',
          body: consoleTestHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Click buttons to generate more console output
        await context.client.click('#immediate-log');
        await context.client.click('#error-log');
        await context.client.click('#delayed-log');

        // Wait a bit for delayed log
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get console output
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result.isError).toBe(false);
        
        const content = result.content[0];
        const consoleOutput = content.text;
        // Verify different types of console output
        expect(consoleOutput).toContain('[log] Page load script executed');
        expect(consoleOutput).toContain('[warn] Warning from head script');
        expect(consoleOutput).toContain('[log] Body script executed');
        expect(consoleOutput).toContain('[log] DOM content loaded');
        expect(consoleOutput).toContain('[log] Immediate button click');
        expect(consoleOutput).toContain('[error] Error from button click');
        expect(consoleOutput).toContain('[log] Delayed log message');
      });
    });

    it('should capture console output with different message types', async () => {
      await withTestContext('console-message-types', async (context) => {
        // Create a page that generates all types of console messages
        const messageTypesHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Console Message Types</title>
</head>
<body>
    <h1>Console Message Types Test</h1>
    <button id="generate-all" onclick="generateAllMessageTypes()">Generate All Types</button>
    
    <script>
        function generateAllMessageTypes() {
            console.log('This is a log message');
            console.info('This is an info message');
            console.warn('This is a warning message');
            console.error('This is an error message');
            console.debug('This is a debug message');
            console.trace('This is a trace message');
        }
    </script>
</body>
</html>`;

        await context.webServer.addResource({
          path: '/',
          body: messageTypesHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate all message types
        await context.client.click('#generate-all');

        // Get console output
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result.isError).toBe(false);
        
        const content = result.content[0];
        const consoleOutput = content.text;
        // Verify different message types are captured
        expect(consoleOutput).toContain('[log] This is a log message');
        expect(consoleOutput).toContain('[info] This is an info message');
        expect(consoleOutput).toContain('[warn] This is a warning message');
        expect(consoleOutput).toContain('[error] This is an error message');
        expect(consoleOutput).toContain('[debug] This is a debug message');
        expect(consoleOutput).toContain('[trace] This is a trace message');
      });
    });
  });

  describe('Console Clearing Functionality', () => {
    it('should clear console logs when clear parameter is true', async () => {
      await withTestContext('console-clear-true', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate some console output
        await context.client.click('#console-button');

        // Get console output with clear=true
        const result1 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, { clear: true }) as GetConsoleResponse;

        expect(result1.isError).toBe(false);
        expect(result1.content[0].text).toContain('[log] Test log message');

        // Get console output again - should be empty after clearing
        const result2 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result2.isError).toBe(false);
        expect(result2.content[0].text).toBe('No console output available');
      });
    });

    it('should not clear console logs when clear parameter is false', async () => {
      await withTestContext('console-clear-false', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate some console output
        await context.client.click('#console-button');

        // Get console output with clear=false
        const result1 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, { clear: false }) as GetConsoleResponse;

        expect(result1.isError).toBe(false);
        expect(result1.content[0].text).toContain('[log] Test log message');

        // Get console output again - should still be there
        const result2 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result2.isError).toBe(false);
        expect(result2.content[0].text).toContain('[log] Test log message');
      });
    });

    it('should not clear console logs when clear parameter is omitted (default false)', async () => {
      await withTestContext('console-clear-default', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate some console output
        await context.client.click('#console-button');

        // Get console output without clear parameter (defaults to false)
        const result1 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result1.isError).toBe(false);
        expect(result1.content[0].text).toContain('[log] Test log message');

        // Get console output again - should still be there
        const result2 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result2.isError).toBe(false);
        expect(result2.content[0].text).toContain('[log] Test log message');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when no page is available', async () => {
      await withTestContext('console-no-page', async (context) => {
        // Try to get console output without navigating to any page first
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        // Verify error response
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);
        
        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toBe('no current page with console output');
      });
    });

    it('should handle console retrieval failures gracefully', async () => {
      await withTestContext('console-retrieval-failure', async (context) => {
        // Add page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Close the page to simulate a failure condition
        await context.server.disconnect();

        // Try to get console output after page is closed
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        // Should return error
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content.type).toBe('text');
        expect(content.text).toBe('no current page with console output');
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response matching GetConsoleResponse interface', async () => {
      await withTestContext('console-response-format', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate console output
        await context.client.click('#console-button');

        // Get console output
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        // Verify response structure matches GetConsoleResponse interface
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('isError');
        expect(Array.isArray(result.content)).toBe(true);
        expect(typeof result.isError).toBe('boolean');
        
        // Verify content structure for successful console retrieval
        expect(result.content).toHaveLength(1);
        const content = result.content[0];
        expect(content).toHaveProperty('type');
        expect(content).toHaveProperty('text');
        expect(content.type).toBe('text');
        expect(typeof content.text).toBe('string');
      });
    });

    it('should return consistent error response format', async () => {
      await withTestContext('console-error-format', async (context) => {
        // Try to get console output without a page
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

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

  describe('Console Output Accumulation', () => {
    it('should accumulate console output over multiple interactions', async () => {
      await withTestContext('console-accumulation', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate console output from multiple interactions
        await context.client.click('#test-button'); // This generates console output
        await context.client.click('#console-button'); // This generates more console output

        // Get console output
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result.isError).toBe(false);
        const content = result.content[0];
        const consoleOutput = content.text;
        
        // Should contain output from both interactions
        expect(consoleOutput).toContain('[log] Button clicked 1 times');
        expect(consoleOutput).toContain('[log] Test log message');
        expect(consoleOutput).toContain('[warn] Test warning message');
        expect(consoleOutput).toContain('[error] Test error message');
      });
    });

    it('should handle empty console output gracefully', async () => {
      await withTestContext('console-empty', async (context) => {
        // Create a page with no console output
        const silentPageHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Silent Page</title>
</head>
<body>
    <h1>Silent Page</h1>
    <p>This page generates no console output.</p>
</body>
</html>`;

        await context.webServer.addResource({
          path: '/',
          body: silentPageHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Get console output from silent page
        const result = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;

        expect(result.isError).toBe(false);
        const content = result.content[0];
        expect(content.text).toBe('No console output available');
      });
    });
  });

  describe('Console Output Persistence', () => {
    it('should maintain console output across multiple tool calls', async () => {
      await withTestContext('console-persistence', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate initial console output
        await context.client.click('#test-button');

        // Get console output first time
        const result1 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;
        expect(result1.content[0].text).toContain('[log] Button clicked 1 times');

        // Generate more console output
        await context.client.click('#test-button');

        // Get console output second time - should contain both
        const result2 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;
        const consoleOutput = result2.content[0].text;
        
        expect(consoleOutput).toContain('[log] Button clicked 1 times');
        expect(consoleOutput).toContain('[log] Button clicked 2 times');
      });
    });

    it('should clear console output only when explicitly requested', async () => {
      await withTestContext('console-explicit-clear', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html'
        });
        await context.client.navigate(context.webServer.getUrl('/'));

        // Generate console output
        await context.client.click('#console-button');

        // Get console output without clearing
        const result1 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, { clear: false }) as GetConsoleResponse;
        expect(result1.content[0].text).toContain('[log] Test log message');

        // Get console output with clearing
        const result2 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, { clear: true }) as GetConsoleResponse;
        expect(result2.content[0].text).toContain('[log] Test log message');

        // Get console output after clearing - should be empty
        const result3 = await context.client.callTool(TOOL_NAMES.GET_CONSOLE, {}) as GetConsoleResponse;
        expect(result3.content[0].text).toBe('No console output available');
      });
    });
  });
});