import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import puppeteer from "puppeteer-core";
import { z } from "zod";

export class PuppeteerMcpServer extends McpServer {

  private page: puppeteer.Page | null = null;
  private readonly browser: puppeteer.Browser;
  private readonly sessionId: string;
  private consoleLogs: string[] = [];

  constructor(sessionId: string, browser: puppeteer.Browser) {
    super({
      name: 'puppeteer-mcp',
      version: '1.0.0',
      description: 'MCP server for controlling Chrome via Puppeteer',
    })
    this.sessionId = sessionId;
    this.browser = browser;

    this.tool(
      "navigate",
      "Navigate to a specific URL",
      { url: z.string().url().describe("URL to navigate to") },
      async ({ url }) => {
        if (!this.page) {
          this.page = await this.browser.newPage();
          this.setupConsoleListener();
        }
        await this.page.goto(url);
        return {
          content: [{ type: "text", text: `Navigated to ${url}` }],
          isError: false
        }
      }
    )

    this.tool(
      "list_tab_urls",
      "List all URLs in the current browser session",
      {},
      async () => {
        const urls = (await this.browser.pages()).map(page => page.url());
        return {
          content: [{ type: "text", text: `Current tab URLs: ${urls.join(", ")}` }],
          isError: false
        }
      }
    )

    this.tool(
      "click",
      "Click on an element",
      { selector: z.string().describe("CSS selector of the element to click") },
      async ({ selector }) => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: "no current page to click" }],
            isError: true
          }
        }
        await this.page.click(selector);
        return {
          content: [{ type: "text", text: `Clicked on ${selector}` }],
          isError: false
        }
      }
    )

    this.tool(
      "take_screenshot",
      "Take a screenshot of the current page",
      {},
      async () => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: "no current page to screenshot" }],
            isError: true
          }
        }
        const buffer = await this.page.screenshot();
        return {
          content: [{ type: "image", data: Buffer.from(buffer).toString('base64'), mimeType: "image/png" }],
          isError: false
        }
      }
    )

    this.tool(
      "get_html",
      "Extract the current page's entire HTML",
      {},
      async () => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: "no current page to extract HTML from" }],
            isError: true
          }
        }
        const html = await this.page.content();
        return {
          content: [{ type: "text", text: html }],
          isError: false
        }
      }
    )

    this.tool(
      "get_console",
      "Get the current console output",
      { clear: z.boolean().describe("Whether to clear the console after getting the output").default(false) },
      async ({ clear }) => {
        if (!this.page) {
          return {
            content: [{ type: "text", text: "no current page with console output" }],
            isError: true
          }
        }

        const output = this.consoleLogs.join('\n');

        if (clear) {
          this.consoleLogs = [];
        }

        return {
          content: [{ type: "text", text: output.length > 0 ? output : "No console output available" }],
          isError: false
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
      console.log("closing page for session", this.sessionId);
      await this.page.close();
    }
  }

}
