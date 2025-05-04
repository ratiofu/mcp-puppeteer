import puppeteer from 'puppeteer-core';
import { initBrowser } from './puppeteer.ts';
import { PuppeteerMcpServer } from './PuppeteerMcpServer.ts';
import readline from 'readline';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const sessionId = "cli";

// Initialize and start CLI
async function main() {
  try {
    // Initialize browser
    console.log('Connecting to Chrome...');
    const browser = await initBrowser();
    console.log('Successfully connected to Chrome');

    // Create transport and server
    const transport = new StdioServerTransport();
    const server = new PuppeteerMcpServer(sessionId, browser);

    // Connect transport and server
    server.connect(transport);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
