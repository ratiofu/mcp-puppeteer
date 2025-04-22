import puppeteer from "puppeteer-core";

// Initialize browser connection
export async function initBrowser(): Promise<puppeteer.Browser> {
    try {
        return await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: { width: 1280, height: 800 }
        });
        console.log('Successfully connected to Chrome instance');
    } catch (error) {
        console.error('Failed to connect to Chrome. Make sure Chrome is running with remote debugging enabled.');
        console.error('Launch Chrome with: google-chrome --remote-debugging-port=9222');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}
