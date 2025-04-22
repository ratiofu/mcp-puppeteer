import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import puppeteer from 'puppeteer-core';
import express from "express";
import { initBrowser } from './puppeteer.ts';
import { setupMcpServer } from './mcp-server.ts';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import bodyParser from 'body-parser';

const port = 7742;


function setupRoutes(app: express.Express, browser: puppeteer.Browser) {

  // Map to store transports by session ID
  const transports = new Map<string, StreamableHTTPServerTransport>();
  const pages = new Map<string, puppeteer.Page>();

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports.get(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    const transport = transports.get(sessionId)!!;
    await transport.handleRequest(req, res);
  };

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.get(sessionId)) {
      transport = transports.get(sessionId)!!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      const page = await browser.newPage();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID
          pages.set(sessionId, page);
          transports.set(sessionId, transport);
        }
      });
      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          transports.delete(transport.sessionId);
        }
      };
      setupMcpServer(page, transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  });

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', handleSessionRequest);

  // Handle DELETE requests for session termination
  app.delete('/mcp', handleSessionRequest);
}


// Initialize and start server
async function main() {
  const browser = await initBrowser();
  const app = express();
  app.use(express.json());
  app.use(bodyParser.json());
  setupRoutes(app, browser);

  app.listen(port, () => {
    console.log(`MCP server listening at http://localhost:${port}/mcp`);
  });
}

main().catch(console.error); 
