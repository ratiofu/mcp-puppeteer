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
import {
  filterBrowsersBySource,
  filterBrowsersByVersion,
  generateDebugPortCheckCommand,
  generateExecutablePaths,
  parseVersionFromOutput,
  selectBestBrowser,
} from './functions.js'

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
   * @param minVersion Minimum version requirement (optional)
   * @param skipLocal Whether to skip local/system browsers (defaults to false)
   * @returns Promise resolving to best BrowserInstallation or null if none found
   */
  async findBestBrowser(
    minVersion?: string,
    skipLocal = false,
  ): Promise<BrowserInstallation | null> {
    // Get all available browsers
    const browsers = await this.discoverBrowsers()

    if (browsers.length === 0) {
      return null
    }

    // Apply filters using pure functions
    let filteredBrowsers = filterBrowsersByVersion(browsers, minVersion)
    filteredBrowsers = filterBrowsersBySource(filteredBrowsers, skipLocal)

    // Select best browser using pure function
    return selectBestBrowser(filteredBrowsers)
  }

  /**
   * Check if a browser is currently running with debug port
   * @param port Debug port number (defaults to 9222)
   * @returns Promise resolving to true if browser is running with debug port
   */
  async checkRunningBrowser(port = 9222): Promise<boolean> {
    try {
      // Generate command using pure function
      const command = generateDebugPortCheckCommand(port)
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
      const output = this.process.execSync(command, { encoding: 'utf8', stdio: 'pipe' })

      // Parse version using pure function
      return parseVersionFromOutput(output)
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
    // Generate possible paths using pure function
    const possiblePaths = generateExecutablePaths(directory)

    // Check each path for existence
    for (const execPath of possiblePaths) {
      if (this.fs.existsSync(execPath)) {
        return execPath
      }
    }

    return null
  }
}
