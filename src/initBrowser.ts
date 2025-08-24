import puppeteer, { type Browser } from "puppeteer-core";
import {
  type BrowserConnectionConfig,
  type BrowserInitResult,
  DEFAULT_CONFIG,
  INTERNAL_ERROR_MESSAGES
} from './types/index.js';
import { errorToString } from './utils/error.js';

/**
 * Initialize browser connection with proper error handling and typing
 */
export async function initBrowser(config?: Partial<BrowserConnectionConfig>): Promise<Browser> {
  const connectionConfig: BrowserConnectionConfig = {
    browserURL: config?.browserURL ?? DEFAULT_CONFIG.BROWSER_URL,
    defaultViewport: config?.defaultViewport ?? null
  };

  try {
    const browser = await puppeteer.connect(connectionConfig);
    console.error('Successfully connected to Chromium instance');
    return browser;
  } catch (error) {
    console.error(INTERNAL_ERROR_MESSAGES.CHROMIUM_CONNECTION_FAILED);
    console.error(INTERNAL_ERROR_MESSAGES.CHROMIUM_LAUNCH_INSTRUCTION);
    console.error('Error details:', errorToString(error));
    process.exit(1);
  }
}

/**
 * Initialize browser connection with result object (useful for testing)
 */
export async function initBrowserSafe(config?: Partial<BrowserConnectionConfig>): Promise<BrowserInitResult> {
  const connectionConfig: BrowserConnectionConfig = {
    browserURL: config?.browserURL ?? DEFAULT_CONFIG.BROWSER_URL,
    defaultViewport: config?.defaultViewport ?? null
  };

  try {
    const browser = await puppeteer.connect(connectionConfig);

    return {
      success: true,
      browser
    };
  } catch (error) {
    return {
      success: false,
      error: errorToString(error)
    };
  }
}
