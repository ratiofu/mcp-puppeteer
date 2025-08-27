/**
 * Pure functions for browser discovery operations
 * Contains functional core with no side effects
 */

import { join } from 'node:path'
import { compareVersions } from '../chrome-for-testing/core.js'
import type { BrowserInstallation } from './BrowserInstallation.js'

/**
 * Filter browsers by minimum version requirement
 * @param browsers Array of browser installations
 * @param minVersion Minimum version requirement (optional)
 * @returns Filtered array of browsers meeting version requirement
 */
export function filterBrowsersByVersion(
  browsers: BrowserInstallation[],
  minVersion?: string,
): BrowserInstallation[] {
  if (!minVersion) {
    return browsers
  }

  return browsers.filter((browser) => compareVersions(browser.version, minVersion) >= 0)
}

/**
 * Filter browsers by source type
 * @param browsers Array of browser installations
 * @param skipLocal Whether to skip local/system browsers
 * @returns Filtered array of browsers
 */
export function filterBrowsersBySource(
  browsers: BrowserInstallation[],
  skipLocal: boolean,
): BrowserInstallation[] {
  if (!skipLocal) {
    return browsers
  }

  return browsers.filter((browser) => browser.source !== 'system')
}

/**
 * Select the best browser from available options
 * Prefers managed browsers over system browsers, and newer versions over older ones
 * @param browsers Array of available browser installations
 * @returns Best browser installation or null if none available
 */
export function selectBestBrowser(browsers: BrowserInstallation[]): BrowserInstallation | null {
  if (browsers.length === 0) {
    return null
  }

  // Prefer managed browsers over system browsers for consistency
  const managedBrowsers = browsers.filter((browser) => browser.source === 'managed')
  if (managedBrowsers.length > 0) {
    // Return the highest version managed browser
    return managedBrowsers.sort((a, b) => compareVersions(b.version, a.version))[0]
  }

  // Fall back to system browsers, return the highest version
  return browsers.sort((a, b) => compareVersions(b.version, a.version))[0]
}

/**
 * Generate possible executable paths for a directory
 * @param directory Base directory to search
 * @param platform Target platform (defaults to current platform)
 * @returns Array of possible executable paths
 */
export function generateExecutablePaths(
  directory: string,
  platform: string = process.platform,
): string[] {
  const executableNames =
    platform === 'win32' ? ['chrome.exe', 'chromium.exe'] : ['chrome', 'chromium']
  const subDirs = ['', 'bin', 'chrome-linux', 'chrome-mac', 'chrome-win']

  const paths: string[] = []

  for (const execName of executableNames) {
    for (const subDir of subDirs) {
      const execPath = subDir ? join(directory, subDir, execName) : join(directory, execName)
      paths.push(execPath)
    }
  }

  return paths
}

/**
 * Parse version string from browser executable output
 * @param output Raw output from browser --version command
 * @returns Parsed version string or 'unknown' if parsing fails
 */
export function parseVersionFromOutput(output: string): string {
  // Extract version number from output (e.g., "Chromium 120.0.6099.109" -> "120.0.6099.109")
  const versionMatch = output.trim().match(/(\d+\.\d+\.\d+\.\d+)/)
  if (versionMatch) {
    return versionMatch[1]
  }

  // Fallback: return 'unknown' if we can't parse it
  return 'unknown'
}

/**
 * Generate command for checking running browser on debug port
 * @param port Debug port number
 * @param platform Target platform (defaults to current platform)
 * @returns Command string to check if browser is running
 */
export function generateDebugPortCheckCommand(
  port: number,
  platform: string = process.platform,
): string {
  return platform === 'win32'
    ? `powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:${port}/json/version' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"`
    : `curl -s --connect-timeout 2 http://localhost:${port}/json/version > /dev/null`
}

/**
 * Re-export compareVersions from chrome-for-testing core for consistency
 */
export { compareVersions }
