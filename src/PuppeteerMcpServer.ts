import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Browser, type Page } from "puppeteer-core";
import { z } from "zod";
import { 
  ERROR_MESSAGES,
  type NavigateRequest,
  type NavigateResponse,
  type ClickRequest,
  type ClickResponse,
  type ScreenshotResponse,
  type GetHtmlResponse,
  type GetConsoleRequest,
  type GetConsoleResponse,
  type ListTabUrlsResponse
} from './types/index.js';

export class PuppeteerMcpServer extends McpServer {

  private page: Page | null = null;
  private readonly browser: Browser;
  private readonly sessionId: string;
  private consoleLogs: string[] = [];

  constructor(sessionId: string, browser: Browser) {
    super({
      name: 'puppeteer-mcp',
      version: '1.0.0',
      description: 'MCP server for controlling Chromium via Puppeteer',
    })
    this.sessionId = sessionId;
    this.browser = browser;

    this.tool(
      "navigate",
      "Navigate to a specific URL",
      { url: z.string().url().describe("URL to navigate to") },
      async ({ url }: NavigateRequest): Promise<NavigateResponse> => {
        try {
          if (!this.page) {
            this.page = await this.browser.newPage();
            this.setupConsoleListener();
          }
          await this.page.goto(url);
          return {
            content: [{ type: "text", text: `Navigated to ${url}` }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `${ERROR_MESSAGES.NAVIGATION_FAILED}: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true
          };
        }
      }
    )

    this.tool(
      "list_tab_urls",
      "List all URLs in the current browser session",
      {},
      async (): Promise<ListTabUrlsResponse> => {
        try {
          const urls = (await this.browser.pages()).map(page => page.url());
          return {
            content: [{ type: "text", text: `Current tab URLs: ${urls.join(", ")}` }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to list tab URLs: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true
          };
        }
      }
    )

    this.tool(
      "click",
      "Click on an element",
      { selector: z.string().describe("CSS selector of the element to click") },
      async ({ selector }: ClickRequest): Promise<ClickResponse> => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: ERROR_MESSAGES.NO_PAGE_TO_CLICK }],
            isError: true
          };
        }
        try {
          await this.page.click(selector);
          return {
            content: [{ type: "text", text: `Clicked on ${selector}` }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `${ERROR_MESSAGES.CLICK_FAILED}: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true
          };
        }
      }
    )

    this.tool(
      "take_screenshot",
      "Take a screenshot of the current page",
      {},
      async (): Promise<ScreenshotResponse> => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: ERROR_MESSAGES.NO_PAGE_TO_SCREENSHOT }],
            isError: true
          };
        }
        try {
          const buffer = await this.page.screenshot();
          return {
            content: [{ type: "image", data: Buffer.from(buffer).toString('base64'), mimeType: "image/png" }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `${ERROR_MESSAGES.SCREENSHOT_FAILED}: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true
          };
        }
      }
    )

    this.tool(
      "get_html",
      "Extract the current page's entire HTML",
      {},
      async (): Promise<GetHtmlResponse> => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: ERROR_MESSAGES.NO_PAGE_TO_EXTRACT_HTML }],
            isError: true
          };
        }
        try {
          const html = await this.page.content();
          return {
            content: [{ type: "text", text: html }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `${ERROR_MESSAGES.HTML_EXTRACTION_FAILED}: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true
          };
        }
      }
    )

    this.tool(
      "get_console",
      "Get the current console output",
      { clear: z.boolean().describe("Whether to clear the console after getting the output").default(false) },
      async ({ clear }: GetConsoleRequest): Promise<GetConsoleResponse> => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: ERROR_MESSAGES.NO_PAGE_WITH_CONSOLE }],
            isError: true
          };
        }

        try {
          const output = this.consoleLogs.join('\n');

          if (clear) {
            this.consoleLogs = [];
          }

          return {
            content: [{ type: "text", text: output.length > 0 ? output : "No console output available" }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `${ERROR_MESSAGES.CONSOLE_RETRIEVAL_FAILED}: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true
          };
        }
      }
    )
  }

  private setupConsoleListener() {
    if (this.page) {
      this.page.on('console', message => {
        const text = `[${message.type()}] ${message.text()}`;
        this.consoleLogs.push(text);
      });
    }
  }

  async disconnect() {
    if (this.page) {
      console.error("closing page for session", this.sessionId);
      try {
        await this.page.close();
        this.page = null;
      } catch (error) {
        console.error("Error closing page:", error);
      }
    }
  }

}
