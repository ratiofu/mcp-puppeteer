import { join, resolve } from 'node:path'
import type { FileSystemOperations } from '../io/FileSystemOperations.js'
import { parseVersion } from './functions.js'
import type { VersionError } from './types.js'
import { VERSION_ERROR_TYPES } from './types.js'

/**
 * Service for managing version requirements and compatibility checking
 */
export class VersionInspectorService {
  constructor(private readonly fileSystem: FileSystemOperations) {}

  /**
   * Get version requirement from chromium.version file
   */
  async getVersionRequirement(projectPath?: string): Promise<string | null> {
    const resolvedProjectPath = projectPath || process.cwd()
    const versionFilePath = join(resolvedProjectPath, 'chromium.version')

    try {
      const exists = this.fileSystem.existsSync(versionFilePath)
      if (!exists) {
        return null
      }

      const content = await this.fileSystem.readFile(versionFilePath, 'utf8')
      const version = content.trim()

      if (!version) {
        return null
      }

      // Validate version format
      parseVersion(version)
      return version
    } catch (error) {
      // Re-throw version format errors as-is
      if (
        error &&
        typeof error === 'object' &&
        'type' in error &&
        error.type === VERSION_ERROR_TYPES.invalidVersionFormat
      ) {
        throw error
      }

      const versionError: VersionError = {
        type: VERSION_ERROR_TYPES.fileReadError,
        message: `Failed to read chromium.version file: ${error instanceof Error ? error.message : String(error)}`,
        cause: error instanceof Error ? error : undefined,
      }
      throw versionError
    }
  }

  /**
   * Get bundled version from the MCP server package
   */
  async getBundledVersion(): Promise<string | null> {
    try {
      // Try to read from package.json in the project root
      const packageJsonPath = resolve(process.cwd(), 'package.json')
      const exists = this.fileSystem.existsSync(packageJsonPath)

      if (!exists) {
        return null
      }

      const content = await this.fileSystem.readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(content)

      // Look for bundled chromium version in package metadata
      // This could be in various places depending on how it's configured
      const bundledVersion =
        packageJson.bundledChromiumVersion ||
        packageJson.chromiumVersion ||
        packageJson.config?.chromiumVersion

      if (bundledVersion && typeof bundledVersion === 'string') {
        // Validate version format
        parseVersion(bundledVersion)
        return bundledVersion
      }

      return null
    } catch (error) {
      // Re-throw version format errors as-is
      if (
        error &&
        typeof error === 'object' &&
        'type' in error &&
        error.type === VERSION_ERROR_TYPES.invalidVersionFormat
      ) {
        throw error
      }

      const versionError: VersionError = {
        type: VERSION_ERROR_TYPES.bundledVersionNotFound,
        message: `Failed to read bundled version: ${error instanceof Error ? error.message : String(error)}`,
        cause: error instanceof Error ? error : undefined,
      }
      throw versionError
    }
  }
}
