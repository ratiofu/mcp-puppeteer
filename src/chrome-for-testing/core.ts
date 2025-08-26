/**
 * Functional core for Chrome for Testing API operations
 * Contains pure functions with no side effects
 */

import type { BrowserVersion, DownloadProgress, PlatformDownload } from './types.js'

/**
 * Compare two version strings semantically
 * @param version1 First version string
 * @param version2 Second version string
 * @returns Negative if version1 < version2, positive if version1 > version2, 0 if equal
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

/**
 * Extract filename from download URL
 * @param url Download URL
 * @returns Extracted filename or default
 */
export function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop()
    return filename || 'chromium-download.zip'
  } catch {
    return 'chromium-download.zip'
  }
}

/**
 * Find download for specific platform
 * @param downloads Array of available downloads
 * @param platform Target platform
 * @returns Download for platform or null if not found
 */
export function findPlatformDownload(
  downloads: PlatformDownload[],
  platform: string,
): PlatformDownload | null {
  return downloads.find((download) => download.platform === platform) || null
}

/**
 * Calculate download progress
 * @param downloaded Bytes downloaded so far
 * @param total Total bytes to download
 * @param startTime Download start timestamp
 * @returns Progress information
 */
export function calculateProgress(
  downloaded: number,
  total: number,
  startTime: number,
): DownloadProgress {
  const elapsed = Date.now() - startTime
  const speed = elapsed > 0 ? (downloaded / elapsed) * 1000 : 0
  const percentage = total > 0 ? (downloaded / total) * 100 : 0

  return {
    total,
    downloaded,
    percentage,
    speed,
  }
}

/**
 * Find the latest version from a list of versions
 * @param versions Array of browser versions
 * @returns Latest version or null if empty
 */
export function findLatestVersion(versions: BrowserVersion[]): BrowserVersion | null {
  if (versions.length === 0) {
    return null
  }

  return versions.sort((a, b) => compareVersions(b.version, a.version))[0]
}

/**
 * Find a specific version by version string
 * @param versions Array of browser versions
 * @param versionString Version to find
 * @returns Found version or null
 */
export function findVersionByString(
  versions: BrowserVersion[],
  versionString: string,
): BrowserVersion | null {
  return versions.find((v) => v.version === versionString) || null
}

/**
 * Transform API response to browser versions
 * @param response Raw API response
 * @returns Array of browser versions
 */
export function transformApiResponse(response: any): BrowserVersion[] {
  if (!response.versions || !Array.isArray(response.versions)) {
    return []
  }

  return response.versions.map((version: any) => ({
    kind: 'chromium' as const,
    version: version.version,
    revision: version.revision,
    downloads: version.downloads,
  }))
}
