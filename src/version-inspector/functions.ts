import type {
  ParsedVersion,
  VersionComparison,
  VersionCompatibility,
  VersionError,
} from './types.js'
import { VERSION_ERROR_TYPES } from './types.js'

/**
 * Parse a version string into components
 */
export function parseVersion(version: string): ParsedVersion {
  // Chrome versions follow the pattern: major.minor.patch.build
  // Example: "120.0.6099.109"
  const versionRegex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
  const match = version.match(versionRegex)

  if (!match) {
    const error: VersionError = {
      type: VERSION_ERROR_TYPES.invalidVersionFormat,
      message: `Invalid version format: ${version}. Expected format: major.minor.patch.build (e.g., "120.0.6099.109")`,
    }
    throw error
  }

  const [, majorStr, minorStr, patchStr, buildStr] = match

  return {
    major: Number.parseInt(majorStr, 10),
    minor: Number.parseInt(minorStr, 10),
    patch: Number.parseInt(patchStr, 10),
    build: Number.parseInt(buildStr, 10),
    original: version,
  }
}

/**
 * Compare two parsed versions
 */
export function compareVersions(
  version1: ParsedVersion,
  version2: ParsedVersion,
): VersionComparison {
  // Compare major version first
  if (version1.major !== version2.major) {
    const result = version1.major > version2.major ? 1 : -1
    return {
      result,
      description: `${version1.original} has ${result > 0 ? 'newer' : 'older'} major version than ${version2.original}`,
    }
  }

  // Compare minor version
  if (version1.minor !== version2.minor) {
    const result = version1.minor > version2.minor ? 1 : -1
    return {
      result,
      description: `${version1.original} has ${result > 0 ? 'newer' : 'older'} minor version than ${version2.original}`,
    }
  }

  // Compare patch version
  if (version1.patch !== version2.patch) {
    const result = version1.patch > version2.patch ? 1 : -1
    return {
      result,
      description: `${version1.original} has ${result > 0 ? 'newer' : 'older'} patch version than ${version2.original}`,
    }
  }

  // Compare build version
  if (version1.build !== version2.build) {
    const result = version1.build > version2.build ? 1 : -1
    return {
      result,
      description: `${version1.original} has ${result > 0 ? 'newer' : 'older'} build version than ${version2.original}`,
    }
  }

  // Versions are equal
  return {
    result: 0,
    description: `${version1.original} is equal to ${version2.original}`,
  }
}

/**
 * Check version compatibility between installed and required versions
 */
export function checkCompatibility(installed: string, required?: string): VersionCompatibility {
  try {
    const installedParsed = parseVersion(installed)

    if (!required) {
      return {
        compatible: true,
        installedVersion: installed,
        recommendation: 'ok',
      }
    }

    const requiredParsed = parseVersion(required)
    const comparison = compareVersions(installedParsed, requiredParsed)

    let compatible: boolean
    let recommendation: 'upgrade' | 'downgrade' | 'ok'

    if (comparison.result >= 0) {
      // Installed version is equal or newer than required
      compatible = true
      recommendation = 'ok'
    } else {
      // Installed version is older than required
      compatible = false
      recommendation = 'upgrade'
    }

    return {
      compatible,
      installedVersion: installed,
      requiredVersion: required,
      recommendation,
    }
  } catch (_error) {
    // If version parsing fails, consider it incompatible
    return {
      compatible: false,
      installedVersion: installed,
      requiredVersion: required,
      recommendation: 'upgrade',
    }
  }
}
