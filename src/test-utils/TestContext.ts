import { Browser } from 'puppeteer-core';
import { PuppeteerMcpServer } from '../PuppeteerMcpServer.js';
import { McpTestClient } from './McpTestClient.js';
import { TestWebServer } from './TestWebServer.js';
import { getTestBrowser } from './test-setup.js';

/**
 * Configuration options for creating a test context instance
 */
export interface TestContextConfig {
    /** Descriptive label for the test (used to generate unique session ID) */
    testLabel: string;
    /** Browser instance to use (optional, will use shared browser if not provided) */
    browser?: Browser;
    /** Base directory for resolving relative paths in web resources (defaults to current working directory) */
    webResourcesBaseDir?: string;
}

type InternalTestContextConfig = {
    sessionId: string;
    browser: Browser;
    webResourcesBaseDir?: string;
    client: McpTestClient;
}

/**
 * Complete test context containing server, client, and web server with lazy initialization
 */
export class TestContext {
    /** The session ID for this test context */
    public readonly sessionId: string;

    /** The browser instance being used */
    public readonly browser: Browser;

    /** Base directory for resolving relative paths in web resources */
    public readonly webResourcesBaseDir: string;

    // Private instances
    private _client: McpTestClient;
    private _webServer: TestWebServer | null = null;

    constructor(config: InternalTestContextConfig) {
        this.sessionId = config.sessionId;
        this.browser = config.browser;
        this.webResourcesBaseDir = config.webResourcesBaseDir || process.cwd();
        this._client = config.client;
    }

    /**
     * The MCP test client for making tool calls
     */
    get client(): McpTestClient {
        return this._client;
    }

    /**
     * The MCP server instance (accessed through the client)
     */
    get server(): PuppeteerMcpServer {
        return this.client.getServer();
    }

    /**
     * Web server for serving test resources (lazy-initialized)
     */
    get webServer(): TestWebServer {
        if (!this._webServer) {
            this._webServer = new TestWebServer(this.webResourcesBaseDir);
        }
        return this._webServer;
    }

    /**
     * Cleanup function to call when test is complete
     */
    async cleanup(): Promise<void> {
        const cleanupErrors: Error[] = [];

        // Stop web server if it was initialized
        if (this._webServer) {
            try {
                await this._webServer.stop();
            } catch (error) {
                cleanupErrors.push(new Error(`Web server cleanup failed: ${error instanceof Error ? error.message : String(error)}`));
            }
        }

        // Disconnect client
        try {
            await this._client.disconnect();
        } catch (error) {
            cleanupErrors.push(new Error(`Client disconnect failed: ${error instanceof Error ? error.message : String(error)}`));
        }

        // If there were cleanup errors, throw a combined error
        if (cleanupErrors.length > 0) {
            const errorMessage = cleanupErrors.map(e => e.message).join('; ');
            throw new Error(`Test cleanup failed: ${errorMessage}`);
        }
    }
}

/**
 * Internal factory function to create a test context instance with proper session isolation
 * 
 * Note: This function is internal. Use `withTestContext()` for safe automatic cleanup.
 * 
 * @param config Configuration options for the test context
 * @returns Promise resolving to a TestContext with lazy-initialized components
 */
async function createTestContext(config: TestContextConfig): Promise<TestContext> {
    const {
        testLabel,
        browser: providedBrowser,
        webResourcesBaseDir
    } = config;

    // Generate session ID from test label
    const sessionId = generateTestSessionId(testLabel);

    // Use provided browser or get the shared test browser
    const browser = providedBrowser || await getTestBrowser();

    // Create and initialize the client
    const client = new McpTestClient(sessionId, browser);
    await client.initialize();

    return new TestContext({
        sessionId,
        browser,
        webResourcesBaseDir,
        client
    });
}

/**
 * Generate a unique session ID for testing
 * Uses timestamp and random string to ensure uniqueness across test runs
 * 
 * @param prefix Optional prefix for the session ID
 * @returns Unique session ID string
 */
function generateTestSessionId(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${randomSuffix}`;
}

/**
 * Utility function to run a test with automatic cleanup
 * Ensures cleanup is called even if the test throws an error
 * 
 * @param testLabelOrConfig Test label string or configuration object
 * @param testFn Function that performs the test using the provided context
 * @returns Promise that resolves when test and cleanup are complete
 * 
 * @example
 * ```typescript
 * // Simple usage with test label
 * await withTestContext('navigate-basic-page', async (context) => {
 *   await context.webServer.addResource({ 
 *     path: '/', 
 *     body: '<h1>Test</h1>', 
 *     contentType: 'text/html' 
 *   });
 *   const result = await context.client.navigate(context.webServer.getUrl('/'));
 *   expect(result.isError).toBe(false);
 * });
 * 
 * // Advanced usage with custom configuration
 * await withTestContext({
 *   testLabel: 'navigate-with-custom-dir',
 *   webResourcesBaseDir: '/custom/path'
 * }, async (context) => {
 *   // Test implementation
 * });
 * ```
 */
export async function withTestContext<T>(
    testLabelOrConfig: string | TestContextConfig,
    testFn: (context: TestContext) => Promise<T>
): Promise<T> {
    // Handle both overloads: string testLabel or full config object
    const config: TestContextConfig = typeof testLabelOrConfig === 'string'
        ? { testLabel: testLabelOrConfig }
        : testLabelOrConfig;

    const context = await createTestContext(config);

    try {
        return await testFn(context);
    } finally {
        await context.cleanup();
    }
}