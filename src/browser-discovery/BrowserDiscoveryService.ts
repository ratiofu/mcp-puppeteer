import type { Dirent } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  ConcreteFileSystemOperations,
  ConcreteProcessOperations,
  type FileSystemOperations,
  type ProcessOperations,
} from '../io/index.js'
import { errorToString } from '../utils/error.js'
import { BrowserInstallation } from './BrowserInstallation.js'
import { isTruthy } from './envUtils.js'
import { findChromiumExecutable } from './findChromiumExecutable.js'

/**
 * Request options for finding the best browser
 */
export interface FindBestBrowserRequest {
  minVersion?: string
  skipLocal?: boolean // Respects DISABLE_LOCAL_CHROMIUM_DISCOVERY environment variable
}

/**
 * Request options for checking running browser
 */
export interface CheckRunningBrowserRequest {
  port?: number
}

/**
 * Service for discovering and managing Chromium browser installations
 * Handles both system and managed browser detection
 *
 * ## Managed Browser Directory Structure
 *
 * Managed browsers are stored in: `~/.puppeteer-mcp/chromium/`
 *
 * Directory structure:
 * ```
 * ~/.puppeteer-mcp/chromium/
 * ├── 120.0.6099.109/          # Version directory
 * │   ├── chrome               # Executable (Linux/macOS)
 * │   ├── chrome.exe           # Executable (Windows)
 * │   └── [other browser files]
 * ├── 121.0.6167.85/           # Another version
 * │   ├── chrome
 * │   └── [other browser files]
 * └── ...
 * ```
 *
 * The service searches for executables in:
 * - Root of version directory: `{version}/chrome` or `{version}/chrome.exe`
 * - Common subdirectories: `{version}/bin/`, `{version}/chrome-linux/`, etc.
 *
 * Each version directory name should match the browser version for proper sorting.
 */
export class BrowserDiscoveryService {
  private readonly managedInstallPath: string
  private process: ProcessOperations
  private fs: FileSystemOperations

  constructor(process?: ProcessOperations, fs?: FileSystemOperations) {
    // Default managed installation path: ~/.puppeteer-mcp/chromium/
    this.managedInstallPath = join(homedir(), '.puppeteer-mcp', 'chromium')
    this.process = process || new ConcreteProcessOperations()
    this.fs = fs || new ConcreteFileSystemOperations()
  }

  /**
   * Discover all available Chromium installations (system and managed)
   * @returns Promise resolving to array of BrowserInstallation instances
   */
  async discoverBrowsers(): Promise<BrowserInstallation[]> {
    const installations: BrowserInstallation[] = []

    // Discover system browsers (unless disabled)
    const skipLocal = isTruthy(this.process.getEnv('DISABLE_LOCAL_CHROMIUM_DISCOVERY'))
    if (!skipLocal) {
      try {
        const systemBrowser = await this.discoverSystemBrowser()
        if (systemBrowser) {
          installations.push(systemBrowser)
        }
      } catch (error) {
        console.warn(`System browser discovery failed: ${errorToString(error)}`)
      }
    }

    // Discover managed browsers
    try {
      const managedBrowsers = await this.discoverManagedBrowsers()
      installations.push(...managedBrowsers)
    } catch (error) {
      console.warn(`Managed browser discovery failed: ${errorToString(error)}`)
    }

    return installations
  }

  /**
   * Find the best available browser based on preferences
   * @param options Options for browser selection
   * @returns Promise resolving to best BrowserInstallation or null if none found
   */
  async findBestBrowser(options: FindBestBrowserRequest = {}): Promise<BrowserInstallation | null> {
    const { minVersion, skipLocal = false } = options

    // Get all available browsers
    const browsers = await this.discoverBrowsers()

    if (browsers.length === 0) {
      return null
    }

    // Filter by minimum version if specified
    let filteredBrowsers = browsers
    if (minVersion) {
      filteredBrowsers = browsers.filter(
        (browser) => compareVersions(browser.version, minVersion) >= 0,
      )
    }

    // Filter out local browsers if skipLocal is true
    if (skipLocal) {
      filteredBrowsers = filteredBrowsers.filter((browser) => browser.source !== 'system')
    }

    if (filteredBrowsers.length === 0) {
      return null
    }

    // Prefer managed browsers over system browsers for consistency
    const managedBrowsers = filteredBrowsers.filter((browser) => browser.source === 'managed')
    if (managedBrowsers.length > 0) {
      // Return the highest version managed browser
      return managedBrowsers.sort((a, b) => compareVersions(b.version, a.version))[0]
    }

    // Fall back to system browsers, return the highest version
    return filteredBrowsers.sort((a, b) => compareVersions(b.version, a.version))[0]
  }

  /**
   * Check if a browser is currently running with debug port
   * @param request Options for checking running browser
   * @returns Promise resolving to true if browser is running with debug port
   */
  async checkRunningBrowser(request: CheckRunningBrowserRequest = {}): Promise<boolean> {
    const { port = 9222 } = request

    try {
      // Try to connect to the debug port using curl or similar
      const command =
        process.platform === 'win32'
          ? `powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:${port}/json/version' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"`
          : `curl -s --connect-timeout 2 http://localhost:${port}/json/version > /dev/null`

      this.process.execSync(command, { stdio: 'pipe' })
      return true
    } catch (_error) {
      // Connection failed, browser is not running with debug port
      return false
    }
  }

  /**
   * Discover system browser installation
   * @returns Promise resolving to BrowserInstallation or null if not found
   */
  private async discoverSystemBrowser(): Promise<BrowserInstallation | null> {
    try {
      const executablePath = findChromiumExecutable(false, this.process)
      const version = await this.getBrowserVersion(executablePath)

      // Create unverified installation (verification can be done later if needed)
      return new BrowserInstallation(executablePath, version, 'system', false)
    } catch (error) {
      console.warn(`System browser discovery failed: ${errorToString(error)}`)
      return null
    }
  }

  /**
   * Get browser version from executable
   * @param executablePath Path to browser executable
   * @returns Promise resolving to version string
   */
  private async getBrowserVersion(executablePath: string): Promise<string> {
    try {
      const command = `"${executablePath}" --version`
      const output = this.process.execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim()

      // Extract version number from output (e.g., "Chromium 120.0.6099.109" -> "120.0.6099.109")
      const versionMatch = output.match(/(\d+\.\d+\.\d+\.\d+)/)
      if (versionMatch) {
        return versionMatch[1]
      }

      // Fallback: return the full output if we can't parse it
      return output
    } catch (error) {
      console.warn(`Failed to get browser version for ${executablePath}: ${errorToString(error)}`)
      return 'unknown'
    }
  }

  /**
   * Discover managed browser installations
   * @returns Promise resolving to array of managed BrowserInstallation instances
   */
  private async discoverManagedBrowsers(): Promise<BrowserInstallation[]> {
    const installations: BrowserInstallation[] = []

    if (!this.fs.existsSync(this.managedInstallPath)) {
      return installations
    }

    try {
      const entries = (await this.fs.readdir(this.managedInstallPath, {
        withFileTypes: true,
      })) as Dirent[]
      const versionDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

      for (const versionDir of versionDirs) {
        try {
          const versionPath = join(this.managedInstallPath, versionDir)
          const executablePath = this.findExecutableInDirectory(versionPath)

          if (executablePath && this.fs.existsSync(executablePath)) {
            // Use directory name as version (should match the actual version)
            const version = versionDir
            installations.push(new BrowserInstallation(executablePath, version, 'managed', false))
          }
        } catch (error) {
          console.warn(
            `Failed to process managed browser in ${versionDir}: ${errorToString(error)}`,
          )
        }
      }
    } catch (error) {
      console.warn(`Failed to read managed browser directory: ${errorToString(error)}`)
    }

    return installations
  }

  /**
   * Find the executable file in a managed browser directory
   * @param directory Directory to search for executable
   * @returns Path to executable or null if not found
   */
  private findExecutableInDirectory(directory: string): string | null {
    const platform = process.platform

    // Platform-specific executable names
    const executableNames =
      platform === 'win32' ? ['chrome.exe', 'chromium.exe'] : ['chrome', 'chromium']

    for (const execName of executableNames) {
      const execPath = join(directory, execName)
      if (this.fs.existsSync(execPath)) {
        return execPath
      }

      // Also check in common subdirectories
      const subDirs = ['bin', 'chrome-linux', 'chrome-mac', 'chrome-win']
      for (const subDir of subDirs) {
        const subDirPath = join(directory, subDir, execName)
        if (this.fs.existsSync(subDirPath)) {
          return subDirPath
        }
      }
    }

    return null
  }
}

/**
 * Compare two version strings
 * @param version1 First version string
 * @param version2 Second version string
 * @returns Negative if version1 < version2, 0 if equal, positive if version1 > version2
 */
function compareVersions(version1: string, version2: string): number {
  // Handle null/undefined versions
  if (!version1 && !version2) return 0
  if (!version1) return -1
  if (!version2) return 1

  // Handle 'unknown' versions
  if (version1 === 'unknown' && version2 === 'unknown') return 0
  if (version1 === 'unknown') return -1
  if (version2 === 'unknown') return 1

  const parts1 = version1.split('.').map(Number)
  const parts2 = version2.split('.').map(Number)

  const maxLength = Math.max(parts1.length, parts2.length)

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 < part2) return -1
    if (part1 > part2) return 1
  }

  return 0
}
