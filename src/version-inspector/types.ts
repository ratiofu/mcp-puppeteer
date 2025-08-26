/**
 * Types for Version Inspector Service
 */

/**
 * Version compatibility result
 */
export interface VersionCompatibility {
  /** Whether the installed version is compatible */
  compatible: boolean
  /** The installed version */
  installedVersion: string
  /** The required version (if any) */
  requiredVersion?: string
  /** Recommendation for the user */
  recommendation?: 'upgrade' | 'downgrade' | 'ok'
}

/**
 * Version comparison result
 */
export interface VersionComparison {
  /** -1 if version1 < version2, 0 if equal, 1 if version1 > version2 */
  result: -1 | 0 | 1
  /** Human-readable comparison description */
  description: string
}

/**
 * Parsed version components
 */
export interface ParsedVersion {
  /** Major version number */
  major: number
  /** Minor version number */
  minor: number
  /** Patch version number */
  patch: number
  /** Build version number */
  build: number
  /** Original version string */
  original: string
}

/**
 * Error types for version operations
 */
export const VERSION_ERROR_TYPES = {
  invalidVersionFormat: 'INVALID_VERSION_FORMAT',
  fileNotFound: 'FILE_NOT_FOUND',
  fileReadError: 'FILE_READ_ERROR',
  bundledVersionNotFound: 'BUNDLED_VERSION_NOT_FOUND',
} as const

/**
 * Union type of version error types
 */
export type VersionErrorType = (typeof VERSION_ERROR_TYPES)[keyof typeof VERSION_ERROR_TYPES]

/**
 * Version operation error
 */
export interface VersionError {
  /** Error type */
  type: VersionErrorType
  /** Error message */
  message: string
  /** Original error if available */
  cause?: Error
}
