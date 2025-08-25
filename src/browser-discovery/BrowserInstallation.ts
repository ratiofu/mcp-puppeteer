import { Browser } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';
import { errorToString } from '../utils/error.js';

/**
 * Launch options for browser instances
 */
export interface LaunchOptions {
  headless?: boolean;
  debugPort?: number;
  userDataDir?: string;
  additionalArgs?: string[];
}

/**
 * Browser executable information
 */
export interface BrowserExecutableInfo {
  path: string;
  version: string;
}

/**
 * Represents a Chromium browser installation that can be launched and managed
 */
export class BrowserInstallation {
  constructor(
    public readonly path: string,
    public readonly version: string,
    public readonly source: 'system' | 'managed',
    public readonly verified: boolean = false
  ) {}

  /**
   * Launch this browser instance with remote debugging
   * @param options Launch configuration options
   * @returns Promise resolving to Browser instance
   */
  async launch(options: LaunchOptions = {}): Promise<Browser> {
    const {
      headless = true,
      debugPort,
      userDataDir,
      additionalArgs = []
    } = options;

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--no-first-run',
      '--disable-default-apps',
      ...additionalArgs
    ];

    // Add debug port if specified
    if (debugPort) {
      args.push(`--remote-debugging-port=${debugPort}`);
    }

    // Add user data directory if specified
    if (userDataDir) {
      args.push(`--user-data-dir=${userDataDir}`);
    }

    try {
      const browser = await puppeteer.launch({
        executablePath: this.path,
        headless,
        defaultViewport: null,
        args
      });

      return browser;
    } catch (error) {
      throw new Error(`Failed to launch browser at ${this.path}: ${errorToString(error)}`);
    }
  }

  /**
   * Verify this installation can launch with remote debugging
   * @returns Promise resolving to true if browser can be launched successfully
   */
  async verify(): Promise<boolean> {
    try {
      // Generate a unique debug port to avoid conflicts
      const debugPort = 9223 + Math.floor(Math.random() * 1000);
      const userDataDir = `/tmp/chromium-verify-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const browser = await this.launch({
        headless: true,
        debugPort,
        userDataDir
      });

      // Try to create a page to ensure the browser is fully functional
      const page = await browser.newPage();
      await page.close();
      await browser.close();

      return true;
    } catch (error) {
      console.warn(`Browser verification failed for ${this.path}: ${errorToString(error)}`);
      return false;
    }
  }

  /**
   * Get browser executable information
   * @returns Browser executable information
   */
  getExecutableInfo(): BrowserExecutableInfo {
    return {
      path: this.path,
      version: this.version
    };
  }

  /**
   * Create a string representation of this installation
   */
  toString(): string {
    return `BrowserInstallation(${this.source}:${this.version}@${this.path})`;
  }
}