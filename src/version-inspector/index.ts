/**
 * Version Inspector Service module
 *
 * Provides version management and compatibility checking for Chromium installations
 */

export type {
  ParsedVersion,
  VersionComparison,
  VersionCompatibility,
  VersionError,
  VersionErrorType,
} from './types.js'
export { VERSION_ERROR_TYPES } from './types.js'
export { VersionInspectorService } from './VersionInspectorService.js'
