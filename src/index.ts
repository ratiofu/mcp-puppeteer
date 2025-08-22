import { initBrowser } from './puppeteer.js';
import { PuppeteerMcpServer } from './PuppeteerMcpServer.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const sessionId = "pipe-session";

// Initialize and start pipe transport server
async function main() {
  try {
    // Initialize browser
    console.error('Connecting to Chrome...');
    const browser = await initBrowser();
    console.error('Successfully connected to Chrome');

    // Create transport and server
    const transport = new StdioServerTransport();
    const server = new PuppeteerMcpServer(sessionId, browser);

    // Handle process termination gracefully
    process.on('SIGINT', async () => {
      console.error('Received SIGINT, cleaning up...');
      await server.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Received SIGTERM, cleaning up...');
      await server.disconnect();
      process.exit(0);
    });

    // Handle transport close
    transport.onclose = async () => {
      console.error('Transport closed, cleaning up...');
      await server.disconnect();
      process.exit(0);
    };

    // Connect transport and server
    await server.connect(transport);
    console.error('MCP server started with pipe transport');

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});