import { Browser } from 'puppeteer-core';
import puppeteer from 'puppeteer-core';

/**
 * Shared browser instance for all tests
 * Using a single browser instance improves test performance and reduces resource usage
 */
let sharedBrowser: Browser | null = null;

/**
 * Track whether we launched the browser ourselves (for cleanup purposes)
 */
let browserLaunchedByTests = false;

/**
 * Check if tests should show the browser (not headless)
 */
function shouldShowBrowser(): boolean {
  const showBrowser = process.env.SHOW_BROWSER;
  return showBrowser === '1' || showBrowser === 'true';
}



/**
 * Find the Chromium executable path using system commands
 */
function findChromiumExecutable(): string {
  const { execSync } = require('child_process');

  const commands = [
    'which chromium',
    'which chromium-browser'
  ];

  for (const command of commands) {
    try {
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (result) {
        console.log(`Found browser executable: ${result}`);
        return result;
      }
    } catch {
      // Command failed, try next one
      continue;
    }
  }

  // Fallback to common macOS paths
  const macPaths = [
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];

  for (const path of macPaths) {
    try {
      execSync(`test -f "${path}"`, { stdio: 'pipe' });
      console.log(`Found browser executable: ${path}`);
      return path;
    } catch {
      continue;
    }
  }

  throw new Error('No Chromium executable found. Please install Chromium: brew install chromium');
}

/**
 * Launch Chromium in headless mode for testing
 * 
 * @returns Promise<Browser> The launched browser instance
 * @throws Error if browser launch fails
 */
async function launchTestBrowser(): Promise<Browser> {
  const showBrowser = shouldShowBrowser();

  console.log(`Launching Chromium in ${showBrowser ? 'visible' : 'headless'} mode for tests...`);

  // Try to find Chromium executable
  const executablePath = findChromiumExecutable();

  try {
    const browser = await puppeteer.launch({
      executablePath,
      headless: !showBrowser,
      defaultViewport: null,
      // Use a different port for test browser to avoid conflicts
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        `--remote-debugging-port=${9223 + Math.floor(Math.random() * 1000)}`, // Random port to avoid conflicts
        `--user-data-dir=/tmp/chromium-test-profile-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // Unique profile per run
        '--no-first-run',
        '--disable-default-apps'
      ]
    });

    browserLaunchedByTests = true;
    return browser;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to launch test browser: ${errorMessage}`);
  }
}

/**
 * Get or create the shared browser instance for testing
 * This function ensures only one browser instance is created across all tests
 * 
 * @returns Promise<Browser> The shared browser instance
 * @throws Error if browser connection fails
 */
export async function getTestBrowser(): Promise<Browser> {
  if (!sharedBrowser) {
    console.log('Initializing shared browser instance for tests...');

    // Always launch our own Chromium instance for tests to avoid interfering with user's browser
    console.log('Launching dedicated Chromium instance for tests...');
    sharedBrowser = await launchTestBrowser();

    // Set up cleanup handler for unexpected browser disconnection
    sharedBrowser.on('disconnected', () => {
      console.warn('Test browser disconnected unexpectedly');
      sharedBrowser = null;
      browserLaunchedByTests = false;
    });

    console.log('Shared browser instance initialized successfully');
  }

  return sharedBrowser;
}

/**
 * Check if the shared browser instance is available and connected
 * 
 * @returns boolean True if browser is available and connected
 */
export function isTestBrowserAvailable(): boolean {
  return sharedBrowser?.connected ?? false;
}

/**
 * Clean up the shared browser instance
 * This should be called during test teardown to ensure proper resource cleanup
 * 
 * @returns Promise<void>
 */
export async function cleanupTestBrowser(): Promise<void> {
  if (sharedBrowser) {
    try {
      console.log('Cleaning up shared browser instance...');

      // Close all pages first to ensure clean shutdown
      const pages = await sharedBrowser.pages();
      await Promise.all(pages.map(page => page.close().catch(err => {
        console.warn('Failed to close page during cleanup:', err.message);
      })));

      if (browserLaunchedByTests) {
        // If we launched the browser ourselves, close it completely
        console.log('Closing browser launched by tests...');
        await sharedBrowser.close();
      } else {
        // If we connected to an existing browser, just disconnect
        console.log('Disconnecting from existing browser instance...');
        await sharedBrowser.disconnect();
      }

      console.log('Shared browser instance cleaned up successfully');
    } catch (error) {
      console.error('Error during browser cleanup:', error instanceof Error ? error.message : String(error));
    } finally {
      sharedBrowser = null;
      browserLaunchedByTests = false;
    }
  }
}

/**
 * Create a new isolated browser page for a test
 * Each test should use its own page to ensure isolation
 * 
 * @param testName Optional test name for debugging purposes
 * @returns Promise<Page> A new browser page
 * @throws Error if browser is not available or page creation fails
 */
export async function createTestPage(testName?: string) {
  const browser = await getTestBrowser();

  try {
    const page = await browser.newPage();

    if (testName) {
      // Set a user agent that includes the test name for debugging
      await page.setUserAgent(`Test-Agent-${testName} ${await page.evaluate(() => navigator.userAgent)}`);
    }

    return page;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create test page${testName ? ` for ${testName}` : ''}: ${errorMessage}`);
  }
}

/**
 * Setup function to be called before all tests
 * This ensures the browser is initialized and ready for testing
 */
export async function setupTests(): Promise<void> {
  try {
    await getTestBrowser();
    console.log('Test setup completed successfully');
  } catch (error) {
    console.error('Test setup failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Teardown function to be called after all tests
 * This ensures proper cleanup of browser resources
 */
export async function teardownTests(): Promise<void> {
  try {
    await cleanupTestBrowser();
    console.log('Test teardown completed successfully');
  } catch (error) {
    console.error('Test teardown failed:', error instanceof Error ? error.message : String(error));
    // Don't throw during teardown to avoid masking test failures
  }
}

/**
 * Error handler for browser connection failures during tests
 * Provides helpful error messages and troubleshooting information
 * 
 * @param error The error that occurred
 * @param context Additional context about when the error occurred
 */
export function handleBrowserConnectionError(error: unknown, context: string = 'browser operation'): never {
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`Browser connection error during ${context}:`, errorMessage);
  console.error('Troubleshooting steps:');
  console.error('1. Tests automatically launch a dedicated Chromium instance');
  console.error('2. To see the browser during tests, set SHOW_BROWSER=1 or SHOW_BROWSER=true');
  console.error('3. Ensure Chromium is installed and accessible to puppeteer-core');
  console.error('4. Check that ports 9223 is not blocked by firewall');
  console.error('5. Try clearing test profiles: rm -rf /tmp/chromium-test-profile-*');

  throw new Error(`${context} failed: ${errorMessage}`);
}