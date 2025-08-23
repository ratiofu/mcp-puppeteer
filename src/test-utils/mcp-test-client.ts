import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { Browser } from 'puppeteer-core';
import { PuppeteerMcpServer } from '../PuppeteerMcpServer.js';
import { TestTransport, createTransportPair } from './test-transport.js';
import { 
  type ToolName,
  type ToolRequestMap,
  type ToolResponseMap,
  type NavigateRequest,
  type NavigateResponse,
  type ClickRequest,
  type ClickResponse,
  type GetConsoleRequest,
  type GetConsoleResponse,
  type ScreenshotResponse,
  type GetHtmlResponse,
  type ListTabUrlsResponse,
  type EmptyRequest,
  TOOL_NAMES
} from '../types/api.js';
import type { CallToolResult, ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Test client wrapper for MCP communication using the official MCP SDK client
 * Provides type-safe tool calling methods and proper test lifecycle management
 */
export class McpTestClient {
  private client: Client;
  private server: PuppeteerMcpServer;
  private clientTransport: TestTransport;
  private serverTransport: TestTransport;
  private initialized: boolean = false;
  private readonly sessionId: string;

  constructor(sessionId: string, browser: Browser) {
    this.sessionId = sessionId;
    
    // Create connected transport pair for client-server communication
    const { clientTransport, serverTransport } = createTransportPair(sessionId);
    this.clientTransport = clientTransport;
    this.serverTransport = serverTransport;

    // Initialize MCP client with proper capabilities
    this.client = new Client({
      name: 'mcp-test-client',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    // Initialize MCP server
    this.server = new PuppeteerMcpServer(sessionId, browser);
  }

  /**
   * Initialize the client-server connection and start communication
   * Must be called before using any tool methods
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Start transports
      await this.clientTransport.start();
      await this.serverTransport.start();

      // Connect client and server to their respective transports
      await this.client.connect(this.clientTransport);
      await this.server.connect(this.serverTransport);

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize MCP test client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generic tool calling method with full type safety
   * @param toolName The name of the tool to call
   * @param parameters The parameters for the tool
   * @returns Promise resolving to the tool's response
   */
  async callTool<T extends ToolName>(
    toolName: T, 
    parameters: ToolRequestMap[T]
  ): Promise<ToolResponseMap[T]> {
    if (!this.initialized) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: parameters as Record<string, unknown>
      });

      return result as ToolResponseMap[T];
    } catch (error) {
      throw new Error(`Tool call failed for ${toolName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Navigate to a specific URL
   * @param url The URL to navigate to
   * @returns Promise resolving to navigation response
   */
  async navigate(url: string): Promise<NavigateResponse> {
    return this.callTool(TOOL_NAMES.NAVIGATE, { url } as NavigateRequest);
  }

  /**
   * Click on an element using CSS selector
   * @param selector CSS selector of the element to click
   * @returns Promise resolving to click response
   */
  async click(selector: string): Promise<ClickResponse> {
    return this.callTool(TOOL_NAMES.CLICK, { selector } as ClickRequest);
  }

  /**
   * Take a screenshot of the current page
   * @returns Promise resolving to screenshot response with base64 image data
   */
  async takeScreenshot(): Promise<ScreenshotResponse> {
    return this.callTool(TOOL_NAMES.TAKE_SCREENSHOT, {} as EmptyRequest);
  }

  /**
   * Extract HTML content from the current page
   * @returns Promise resolving to HTML content response
   */
  async getHtml(): Promise<GetHtmlResponse> {
    return this.callTool(TOOL_NAMES.GET_HTML, {} as EmptyRequest);
  }

  /**
   * Get console output from the current page
   * @param clear Whether to clear console logs after retrieving them
   * @returns Promise resolving to console output response
   */
  async getConsole(clear: boolean = false): Promise<GetConsoleResponse> {
    return this.callTool(TOOL_NAMES.GET_CONSOLE, { clear } as GetConsoleRequest);
  }

  /**
   * List all tab URLs in the current browser session
   * @returns Promise resolving to tab URLs response
   */
  async listTabUrls(): Promise<ListTabUrlsResponse> {
    return this.callTool(TOOL_NAMES.LIST_TAB_URLS, {} as EmptyRequest);
  }

  /**
   * List all available tools from the server
   * @returns Promise resolving to tools list
   */
  async listTools(): Promise<ListToolsResult> {
    if (!this.initialized) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    try {
      return await this.client.listTools();
    } catch (error) {
      throw new Error(`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the session ID for this test client
   * @returns The session ID string
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Check if the client is initialized and ready for use
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get message history from the transport for debugging purposes
   * @returns Object containing client-to-server and server-to-client message arrays
   */
  getMessageHistory(): {
    clientToServer: any[];
    serverToClient: any[];
  } {
    return {
      clientToServer: this.clientTransport.getClientToServerMessages(),
      serverToClient: this.clientTransport.getServerToClientMessages()
    };
  }

  /**
   * Clear message history from the transport
   */
  clearMessageHistory(): void {
    this.clientTransport.clearMessageHistory();
    this.serverTransport.clearMessageHistory();
  }

  /**
   * Clean up resources and disconnect client-server communication
   * Should be called in test cleanup to prevent resource leaks
   */
  async disconnect(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Disconnect server first to clean up browser resources
      await this.server.disconnect();
      
      // Close client connection
      await this.client.close();
      
      // Close transports
      await this.clientTransport.close();
      await this.serverTransport.close();
      
      this.initialized = false;
    } catch (error) {
      console.error(`Error during McpTestClient disconnect: ${error instanceof Error ? error.message : String(error)}`);
      // Still mark as not initialized even if cleanup failed
      this.initialized = false;
      throw error;
    }
  }
}

/**
 * Factory function to create and initialize an McpTestClient
 * @param sessionId Unique session identifier for the test
 * @param browser Browser instance to use for the server
 * @returns Promise resolving to initialized McpTestClient
 */
export async function createMcpTestClient(sessionId: string, browser: Browser): Promise<McpTestClient> {
  const client = new McpTestClient(sessionId, browser);
  await client.initialize();
  return client;
}