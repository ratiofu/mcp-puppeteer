import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import puppeteer from "puppeteer-core";
import { z } from "zod";

export class PuppeteerMcpServer extends McpServer {

  private page: puppeteer.Page | null = null;
  private readonly browser: puppeteer.Browser;
  private readonly sessionId: string;
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
        }
        await this.page.goto(url);
        return {
          content: [{ type: "text", text: `Navigated to ${url}` }],
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

  }

  async disconnect() {
    if (this.page) {
      console.log("closing page for session", this.sessionId);
      await this.page.close();
    }
  }

}
