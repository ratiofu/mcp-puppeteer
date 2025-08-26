import type { ExecSyncOptions } from 'node:child_process'
import type { Dirent } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  BrowserVersion,
  DownloadOptions,
  DownloadProgress,
  DownloadResult,
} from '../chrome-for-testing/types'
import {
  ConcreteFileSystemOperations,
  ConcreteProcessOperations,
  type FileSystemOperations,
  type ProcessOperations,
} from '../io/index.js'
import { errorToString } from '../utils/error'
import { BrowserInstallation } from './BrowserInstallation'

/**
 * Chrome for Testing API interface for dependency injection
 */
export interface ChromeForTestingApiInterface {
  getLatestVersion(): Promise<BrowserVersion | null>
  findVersion(version: string): Promise<BrowserVersion | null>
  downloadChromium(version: BrowserVersion, options: DownloadOptions): Promise<DownloadResult>
}

/**
 * Browser installation factory interface for dependency injection
 */
export interface BrowserInstallationFactory {
  create(
    path: string,
    version: string,
    source: 'system' | 'managed',
    verified?: boolean,
  ): BrowserInstallation
}

/**
 * Default browser installation factory
 */
export class DefaultBrowserInstallationFactory implements BrowserInstallationFactory {
  create(
    path: string,
    version: string,
    source: 'system' | 'managed',
    verified = false,
  ): BrowserInstallation {
    return new BrowserInstallation(path, version, source, verified)
  }
}

/**
 * Request for installing Chromium
 */
export interface InstallChromiumManagerRequest {
  version?: string
}

/**
 * Result of Chromium installation
 */
export interface InstallationResult {
  success: boolean
  version: string
  path: string
  error?: string
}

/**
 * Response from cleanup operation
 */
export interface CleanupResponse {
  removedVersions: string[]
}

// Default managed installation path: ~/.puppeteer-mcp/chromium/
function getDefaultManagedInstallationPath() {
  return join(homedir(), '.puppeteer-mcp', 'chromium')
}

/**
 * Service for managing Chromium browser installations
 * Handles download, installation, and lifecycle management using Chrome for Testing API
 *
 * ## Managed Installation Directory Structure
 *
 * Browsers are installed in: `~/.puppeteer-mcp/chromium/`
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
 */
export class BrowserManagerService {
  private readonly managedInstallPath: string

  constructor(
    private readonly chromeForTestingApi: ChromeForTestingApiInterface,
    private readonly fs: FileSystemOperations,
    private readonly process: ProcessOperations,
    private readonly browserFactory: BrowserInstallationFactory,
    managedInstallPath: string = getDefaultManagedInstallationPath(),
  ) {
    this.managedInstallPath = managedInstallPath
    this.chromeForTestingApi = chromeForTestingApi
    this.fs = fs || new ConcreteFileSystemOperations()
    this.process = process || new ConcreteProcessOperations()
    this.browserFactory = browserFactory || new DefaultBrowserInstallationFactory()
  }

  /**
   * Download and install Chromium from Chrome for Testing
   * @param request Installation request with optional version
   * @returns Promise resolving to installation result
   */
  async installChromium(request: InstallChromiumManagerRequest = {}): Promise<InstallationResult> {
    try {
      // Determine version to install
      let versionToInstall: BrowserVersion

      if (request.version) {
        const specificVersion = await this.chromeForTestingApi.findVersion(request.version)
        if (!specificVersion) {
          return {
            success: false,
            version: request.version,
            path: '',
            error: `Version ${request.version} not found in Chrome for Testing API`,
          }
        }
        versionToInstall = specificVersion
      } else {
        const latestVersion = await this.chromeForTestingApi.getLatestVersion()
        if (!latestVersion) {
          return {
            success: false,
            version: 'unknown',
            path: '',
            error: 'No versions available from Chrome for Testing API',
          }
        }
        versionToInstall = latestVersion
      }

      // Check if version is already installed
      const existingInstallation = await this.getExistingInstallation(versionToInstall.version)
      if (existingInstallation) {
        // Verify existing installation
        const isValid = await existingInstallation.verify()
        if (isValid) {
          return {
            success: true,
            version: versionToInstall.version,
            path: existingInstallation.path,
          }
        }
        // Remove invalid installation
        await this.removeVersion(versionToInstall.version)
      }

      // Create version-specific installation directory
      const versionInstallPath = join(this.managedInstallPath, versionToInstall.version)
      await this.fs.mkdir(versionInstallPath, { recursive: true })

      // Download Chromium
      const downloadResult = await this.chromeForTestingApi.downloadChromium(versionToInstall, {
        destinationDir: versionInstallPath,
        onProgress: (progress: DownloadProgress) => {
          // Log progress for debugging
          console.log(
            `Download progress: ${progress.percentage.toFixed(1)}% (${progress.downloaded}/${progress.total} bytes)`,
          )
        },
        timeout: 600_000, // 10 minutes for large downloads
      })

      if (!downloadResult.success || !downloadResult.filePath) {
        return {
          success: false,
          version: versionToInstall.version,
          path: '',
          error: downloadResult.error || 'Download failed without error message',
        }
      }

      // Extract downloaded archive
      const extractedPath = await this.extractArchive(downloadResult.filePath, versionInstallPath)

      // Find the executable in the extracted files
      const executablePath = await this.findExecutableInExtraction(extractedPath)
      if (!executablePath) {
        return {
          success: false,
          version: versionToInstall.version,
          path: '',
          error: 'Could not find executable in extracted files',
        }
      }

      // Create BrowserInstallation and verify it works
      const installation = this.browserFactory.create(
        executablePath,
        versionToInstall.version,
        'managed',
        false,
      )
      const isValid = await installation.verify()

      if (!isValid) {
        return {
          success: false,
          version: versionToInstall.version,
          path: executablePath,
          error: 'Installed browser failed verification (could not launch with remote debugging)',
        }
      }

      // Clean up download archive
      try {
        await this.fs.rm(downloadResult.filePath, { force: true })
      } catch (error) {
        console.warn(`Failed to clean up download archive: ${errorToString(error)}`)
      }

      return {
        success: true,
        version: versionToInstall.version,
        path: executablePath,
      }
    } catch (error) {
      return {
        success: false,
        version: request.version || 'unknown',
        path: '',
        error: `Installation failed: ${errorToString(error)}`,
      }
    }
  }

  /**
   * Clean up old browser versions, keeping only the most recent ones
   * @param keepCount Number of versions to keep (default: 2)
   * @returns Promise resolving to cleanup response
   */
  async cleanupOldVersions(keepCount = 2): Promise<CleanupResponse> {
    const removedVersions: string[] = []

    try {
      if (!this.fs.existsSync(this.managedInstallPath)) {
        return { removedVersions }
      }

      // Get all version directories
      const entries = (await this.fs.readdir(this.managedInstallPath, {
        withFileTypes: true,
      })) as Dirent[]
      const versionDirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => /^\d+\.\d+\.\d+\.\d+$/.test(name)) // Only version-like directories

      if (versionDirs.length <= keepCount) {
        return { removedVersions }
      }

      // Sort versions in descending order (newest first)
      const sortedVersions = versionDirs.sort((a, b) => compareVersions(b, a))

      // Remove old versions (keep only the newest `keepCount` versions)
      const versionsToRemove = sortedVersions.slice(keepCount)

      for (const version of versionsToRemove) {
        try {
          await this.removeVersion(version)
          removedVersions.push(version)
        } catch (error) {
          console.warn(`Failed to remove version ${version}: ${errorToString(error)}`)
        }
      }
    } catch (error) {
      console.warn(`Cleanup operation failed: ${errorToString(error)}`)
    }

    return { removedVersions }
  }

  /**
   * Create BrowserInstallation instance from path
   * @param path Path to browser executable
   * @returns Promise resolving to BrowserInstallation
   */
  async createInstallation(path: string): Promise<BrowserInstallation> {
    // Try to determine version from path or executable
    let version = 'unknown'

    // If path is in managed installation directory, extract version from path
    if (path.startsWith(this.managedInstallPath)) {
      const relativePath = path.substring(this.managedInstallPath.length + 1)
      const versionMatch = relativePath.match(/^(\d+\.\d+\.\d+\.\d+)/)
      if (versionMatch) {
        version = versionMatch[1]
      }
    }

    // If we couldn't get version from path, try to get it from executable
    if (version === 'unknown') {
      try {
        const command = `"${path}" --version`
        const output = this.process
          .execSync(command, { encoding: 'utf8', stdio: 'pipe' } as ExecSyncOptions)
          .trim()
        const versionMatch = output.match(/(\d+\.\d+\.\d+\.\d+)/)
        if (versionMatch) {
          version = versionMatch[1]
        }
      } catch (error) {
        console.warn(`Failed to get version from executable: ${errorToString(error)}`)
      }
    }

    const source = path.startsWith(this.managedInstallPath) ? 'managed' : 'system'
    return this.browserFactory.create(path, version, source, false)
  }

  /**
   * Get existing installation for a specific version
   * @private
   */
  private getExistingInstallation(version: string): BrowserInstallation | null {
    const versionPath = join(this.managedInstallPath, version)
    if (!this.fs.existsSync(versionPath)) return null
    const executablePath = findExecutableInDirectory(this.fs, versionPath)
    if (!executablePath) return null
    return this.browserFactory.create(executablePath, version, 'managed', false)
  }

  /**
   * Remove a specific version directory
   * @private
   */
  private async removeVersion(version: string): Promise<void> {
    const versionPath = join(this.managedInstallPath, version)
    if (this.fs.existsSync(versionPath)) {
      await this.fs.rm(versionPath, { recursive: true, force: true })
    }
  }

  /**
   * Extract downloaded archive
   * @private
   */
  private async extractArchive(archivePath: string, destinationDir: string): Promise<string> {
    const platform = process.platform

    try {
      if (archivePath.endsWith('.zip')) {
        // Use unzip command for ZIP files
        const command =
          platform === 'win32'
            ? `powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destinationDir}' -Force"`
            : `unzip -q -o "${archivePath}" -d "${destinationDir}"`

        this.process.execSync(command, { stdio: 'pipe' } as ExecSyncOptions)
      } else if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
        // Use tar command for tar.gz files
        const command = `tar -xzf "${archivePath}" -C "${destinationDir}"`
        this.process.execSync(command, { stdio: 'pipe' } as ExecSyncOptions)
      } else {
        throw new Error(`Unsupported archive format: ${archivePath}`)
      }

      return destinationDir
    } catch (error) {
      throw new Error(`Failed to extract archive ${archivePath}: ${errorToString(error)}`)
    }
  }

  /**
   * Find executable in extracted files
   * @private
   */
  private async findExecutableInExtraction(extractedPath: string): Promise<string | null> {
    // Look for executable in common locations within the extracted directory
    const executableNames =
      process.platform === 'win32' ? ['chrome.exe', 'chromium.exe'] : ['chrome', 'chromium']

    // Search recursively in the extracted directory
    return await findExecutableRecursively(this.fs, extractedPath, executableNames)
  }
}

/**
 * Find executable recursively in directory
 * @private
 */
export async function findExecutableRecursively(
  fs: FileSystemOperations,
  directory: string,
  executableNames: string[],
): Promise<string | null> {
  try {
    const entries = (await fs.readdir(directory, { withFileTypes: true })) as Dirent[]

    // First, check files in current directory
    for (const entry of entries) {
      if (entry.isFile() && executableNames.includes(entry.name)) {
        const fullPath = join(directory, entry.name)
        // Check if file is executable (on Unix systems)
        if (process.platform !== 'win32') {
          try {
            const stats = await fs.stat(fullPath)
            if (!(stats.mode & 0o111)) {
              // Not executable, skip
              continue
            }
          } catch {
            continue
          }
        }
        return fullPath
      }
    }

    // Then, search subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subdirPath = join(directory, entry.name)
        const found = await findExecutableRecursively(fs, subdirPath, executableNames)
        if (found) {
          return found
        }
      }
    }

    return null
  } catch (error) {
    console.warn(`Error searching directory ${directory}: ${errorToString(error)}`)
    return null
  }
}

/**
 * Find executable in a specific directory (non-recursive)
 * @private
 */
export function findExecutableInDirectory(
  fs: FileSystemOperations,
  directory: string,
): string | null {
  const executableNames =
    process.platform === 'win32' ? ['chrome.exe', 'chromium.exe'] : ['chrome', 'chromium']

  for (const execName of executableNames) {
    const execPath = join(directory, execName)
    if (fs.existsSync(execPath)) return execPath

    // Also check in common subdirectories
    const subDirs = ['bin', 'chrome-linux', 'chrome-mac', 'chrome-win']
    for (const subDir of subDirs) {
      const subDirPath = join(directory, subDir, execName)
      if (fs.existsSync(subDirPath)) return subDirPath
    }
  }

  return null
}

/**
 * Compare two version strings
 * @private
 */
export function compareVersions(version1: string, version2: string): number {
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
