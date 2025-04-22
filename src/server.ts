import puppeteer from 'puppeteer-core';
import express from "express";
import { initBrowser } from './puppeteer.ts';
import { PuppeteerMcpServer } from './PuppeteerMcpServer.ts';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import http from 'http';

const port = 7742;

function setupRoutes(app: express.Express, browser: puppeteer.Browser) {

  const sessions = new Map<string, { transport: SSEServerTransport, server: PuppeteerMcpServer }>();

  app.get("/sse", async (req: express.Request, res: express.Response) => {
    // Disable response timeout
    if (res.socket) res.socket.setTimeout(0);
    res.setHeader('Connection', 'keep-alive');

    const transport = new SSEServerTransport("/mcp", res);
    const { sessionId } = transport;
    console.log("new SSE session", sessionId);
    const server = new PuppeteerMcpServer(sessionId, browser);
    server.connect(transport);
    sessions.set(sessionId, { transport, server });

    // Send a heartbeat every 30 seconds to keep the connection alive
    const heartbeatInterval = setInterval(() => res.write(":heartbeat\n\n"), 30_000);

    transport.onclose = () => {
      console.log("client disconnected", sessionId);
      clearInterval(heartbeatInterval);
      server.disconnect();
      sessions.delete(sessionId);
    }

    // Handle client disconnect
    req.on('close', () => {
      console.log("client connection closed", sessionId);
      clearInterval(heartbeatInterval);
    });
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

  const server = http.createServer(app);
  server.timeout = 0; // Disable timeout
  server.keepAliveTimeout = 0; // Disable keep-alive timeout
  server.listen(port, () => {
    console.log(`MCP server listening at http://localhost:${port}/mcp`);
  });
}

main().catch(console.error);
