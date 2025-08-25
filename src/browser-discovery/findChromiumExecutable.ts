import { execSync } from 'child_process';
import { errorToString } from '../utils/error.js';
import { isTruthy } from './envUtils.js';

/**
 * Find the Chromium executable path using system commands
 * Extracted and refactored from test utilities for production use
 * 
 * @param skipLocalDiscovery If true, skips local browser discovery (respects DISABLE_LOCAL_CHROMIUM_DISCOVERY)
 * @returns The path to the Chromium executable
 * @throws Error if no Chromium executable is found
 */
export function findChromiumExecutable(skipLocalDiscovery: boolean = false): string {
  // Check environment variable to disable local discovery
  if (skipLocalDiscovery || isTruthy(process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY)) {
    throw new Error('Local Chromium discovery disabled by configuration');
  }

  // Try common system commands first
  const commands = [
    'which chromium',
    'which chromium-browser',
    'which google-chrome',
    'which google-chrome-stable'
  ];

  for (const command of commands) {
    try {
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
      if (result) {
        console.log(`Found browser executable via command '${command}': ${result}`);
        return result;
      }
    } catch (err) {
      console.warn(`findChromiumExecutable: probe failed for command '${command}': ${errorToString(err)}`);
      continue;
    }
  }

  // Fallback to common installation paths by platform
  const fallbackPaths = getPlatformSpecificPaths();

  for (const path of fallbackPaths) {
    try {
      execSync(`test -f "${path}"`, { stdio: 'pipe' });
      console.log(`Found browser executable at fallback path: ${path}`);
      return path;
    } catch (err) {
      console.warn(`findChromiumExecutable: path probe failed for '${path}': ${errorToString(err)}`);
      continue;
    }
  }

  throw new Error('No Chromium executable found. Please install Chromium or Chrome.');
}

/**
 * Get platform-specific fallback paths for Chromium/Chrome installations
 * @returns Array of potential executable paths for the current platform
 */
function getPlatformSpecificPaths(): string[] {
  const platform = process.platform;

  switch (platform) {
    case 'darwin': // macOS
      return [
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
      ];

    case 'linux':
      return [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/snap/bin/chromium',
        '/opt/google/chrome/chrome'
      ];

    case 'win32': // Windows
      return [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Chromium\\Application\\chrome.exe',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
      ];

    default:
      console.warn(`Unsupported platform: ${platform}. Using Linux fallback paths.`);
      return [
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/usr/bin/google-chrome'
      ];
  }
}