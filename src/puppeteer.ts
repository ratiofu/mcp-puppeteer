import puppeteer, { type Browser } from "puppeteer-core";

// Initialize browser connection
export async function initBrowser(): Promise<Browser> {
  try {
    return await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    console.log('Successfully connected to Chrome instance');
  } catch (error) {
    console.error('Failed to connect to Chrome. Make sure Chrome is running with remote debugging enabled.');
    console.error('Launch Chrome with: open -a "Google Chrome" --args --remote-debugging-port=9222');
    console.error('Error details:', (error as Error).message);
    process.exit(1);
  }
}
