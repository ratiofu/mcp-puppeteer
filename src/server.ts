import puppeteer from 'puppeteer-core';
import express from "express";
import { initBrowser } from './puppeteer.ts';
import { PuppeteerMcpServer } from './PuppeteerMcpServer.ts';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const port = 7742;

function setupRoutes(app: express.Express, browser: puppeteer.Browser) {

  const sessions = new Map<string, { transport: SSEServerTransport, server: PuppeteerMcpServer }>();

  app.get("/sse", async (req: express.Request, res: express.Response) => {
    const transport = new SSEServerTransport("/mcp", res);
    const { sessionId } = transport;
    console.log("new SSE session", sessionId);
    const server = new PuppeteerMcpServer(sessionId, browser);
    server.connect(transport);
    sessions.set(sessionId, { transport, server });
    transport.onclose = () => {
      console.log("client disconnected", sessionId);
      server.disconnect();
      sessions.delete(sessionId);
    }
  });

  app.post("/mcp", (req: express.Request, res: express.Response) => {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    console.log("mcp", sessionId);
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session) {
        session.transport.handlePostMessage(req, res);
      } else {
        console.error("session not found", sessionId);
        res.status(404).send('session not found');
      }
    } else {
      console.error("missing sessionId parameter");
      res.status(400).send('missing sessionId parameter');
    }
  });

}

// Initialize and start server
async function main() {
  const browser = await initBrowser();
  const app = express();
  setupRoutes(app, browser);

  app.listen(port, () => {
    console.log(`MCP server listening at http://localhost:${port}/mcp`);
  });
}

main().catch(console.error);
