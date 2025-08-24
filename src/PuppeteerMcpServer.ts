import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Browser, type Page, type BrowserContext } from "puppeteer-core";
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
import { errorToString } from './utils/error.js';

export class PuppeteerMcpServer extends McpServer {

  private page: Page | null = null;
  private context: BrowserContext | null = null;
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
          if (!this.context) {
            this.context = await this.browser.createBrowserContext();
          }
          if (!this.page) {
            this.page = await this.context.newPage();
            this.setupConsoleListener();
          }
          await this.page.goto(url, { waitUntil: 'domcontentloaded' });
          return {
            content: [{ type: "text", text: `Navigated to ${url}` }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `${ERROR_MESSAGES.NAVIGATION_FAILED}: ${errorToString(error)}` }],
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
          // Limit to this server session's context pages for isolation
          const urlsSet = new Set<string>();
          if (this.page) {
            urlsSet.add(this.page.url());
          }
          if (this.context) {
            const pages = await this.context.pages();
            for (const p of pages) urlsSet.add(p.url());
          }
          const urls = Array.from(urlsSet);
          return {
            content: [{ type: "text", text: `Current tab URLs: ${urls.join(", ")}` }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to list tab URLs: ${errorToString(error)}` }],
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
          await this.page.waitForSelector(selector, { timeout: 300 });
          await this.page.click(selector);
          return {
            content: [{ type: "text", text: `Clicked on ${selector}` }],
            isError: false
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `${ERROR_MESSAGES.CLICK_FAILED}: ${errorToString(error)}` }],
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
            content: [{ type: "text", text: `${ERROR_MESSAGES.SCREENSHOT_FAILED}: ${errorToString(error)}` }],
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
            content: [{ type: "text", text: `${ERROR_MESSAGES.HTML_EXTRACTION_FAILED}: ${errorToString(error)}` }],
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
            content: [{ type: "text", text: `${ERROR_MESSAGES.CONSOLE_RETRIEVAL_FAILED}: ${errorToString(error)}` }],
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
    // Capture references and clear first to avoid races
    const pageRef = this.page;
    const contextRef = this.context;
    this.page = null;
    this.context = null;

    // Fire-and-forget page close to avoid teardown hangs during in-flight navigations
    if (pageRef) {
      console.info("closing page for session", this.sessionId);
      try {
        // Do not await; ensure rejection is handled/logged
        void pageRef.close().catch((error) => {
          const msg = errorToString(error);
          // Suppress noisy log when the page was already closed by context
          if (!(msg.includes("No target with given id found") || msg.includes("Connection closed"))) {
            console.error("Error closing page:", msg);
          }
        });
      } catch (error) {
        const msg = errorToString(error);
        if (!(msg.includes("No target with given id found") || msg.includes("Connection closed"))) {
          console.error("Error closing page:", msg);
        }
      }
    }

    // Close context (also closes any remaining pages). Fire-and-forget to avoid hangs.
    if (contextRef) {
      try {
        void contextRef.close().catch((error) => {
          const msg = errorToString(error);
          if (!msg.includes("Connection closed")) {
            console.error("Error closing browser context:", msg);
          }
        });
      } catch (error) {
        const msg = errorToString(error);
        if (!msg.includes("Connection closed")) {
          console.error("Error closing browser context:", msg);
        }
      }
    }
  }

}
