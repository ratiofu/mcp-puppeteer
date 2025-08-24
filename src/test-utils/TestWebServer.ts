import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { errorToString } from '../utils/error.js';

export interface TestResource {
  path: string;
  body?: string;
  bodySourcePath?: string;
  contentType: string;
}

export class TestWebServer {
  private server: ReturnType<typeof createServer>;
  private port: number = 0;
  private resources: Map<string, TestResource> = new Map();
  private isRunning: boolean = false;

  constructor(private testDir: string) {
    this.server = createServer(this.handleRequest.bind(this));
  }

  async start(): Promise<number> {
    if (this.isRunning) {
      return this.port;
    }

    return new Promise((resolve, reject) => {
      this.server.listen(0, 'localhost', () => {
        const address = this.server.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          this.isRunning = true;
          resolve(this.port);
        } else {
          reject(new Error('Failed to get server port'));
        }
      });
    });
  }

  private async autoStart() {
    if (!this.isRunning) {
      try {
        await this.start();
      } catch (error) {
        console.error('Failed to auto-start test web server:', error);
        throw error;
      }
    }
  }

  async addResource(resource: TestResource) {
    this.resources.set(resource.path, resource);
    await this.autoStart()
  }

  async addResources(resources: TestResource[]) {
    resources.forEach(resource => this.resources.set(resource.path, resource));
    await this.autoStart()

  }

  getUrl(path: string = '/'): string {
    if (!this.isRunning) {
      throw new Error('Test web server is not running. Add resources first to auto-start the server.');
    }
    return `http://localhost:${this.port}${path}`;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url || '/';
    const resource = this.resources.get(url);

    if (!resource) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    try {
      let body: string;
      if (resource.body) {
        body = resource.body;
      } else if (resource.bodySourcePath) {
        const fullPath = join(this.testDir, resource.bodySourcePath);
        body = await readFile(fullPath, 'utf-8');
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('No body or bodySourcePath specified');
        return;
      }

      res.writeHead(200, { 'Content-Type': resource.contentType });
      res.end(body);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal Server Error: ${errorToString(error)}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return; // Already stopped, no need to close
    }

    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        this.isRunning = false;
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
