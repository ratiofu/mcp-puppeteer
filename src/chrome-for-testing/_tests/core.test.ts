import { describe, expect, it } from 'vitest'
import {
  calculateProgress,
  compareVersions,
  extractFilenameFromUrl,
  findLatestVersion,
  findPlatformDownload,
  findVersionByString,
  transformApiResponse,
} from '../core.js'
import type { BrowserVersion } from '../types.js'

describe('Chrome for Testing Core Functions', () => {
  describe('compareVersions', () => {
    it('should compare versions correctly', () => {
      expect(compareVersions('120.0.6099.109', '119.0.6045.105')).toBeGreaterThan(0)
      expect(compareVersions('119.0.6045.105', '120.0.6099.109')).toBeLessThan(0)
      expect(compareVersions('120.0.6099.109', '120.0.6099.109')).toBe(0)
      expect(compareVersions('120.0.6099.109', '120.0.6099.110')).toBeLessThan(0)
      expect(compareVersions('121.0.0.0', '120.9.9.9')).toBeGreaterThan(0)
    })

    it('should handle versions with different number of parts', () => {
      expect(compareVersions('120.0.6099', '120.0.6099.0')).toBe(0)
      expect(compareVersions('120.0', '120.0.0.0')).toBe(0)
      expect(compareVersions('120', '120.0.0.0')).toBe(0)
    })
  })

  describe('extractFilenameFromUrl', () => {
    it('should extract filename from valid URL', () => {
      const filename = extractFilenameFromUrl('https://example.com/path/chrome-mac-arm64.zip')
      expect(filename).toBe('chrome-mac-arm64.zip')
    })

    it('should return default filename for invalid URL', () => {
      const filename = extractFilenameFromUrl('invalid-url')
      expect(filename).toBe('chromium-download.zip')
    })

    it('should return default filename for URL without filename', () => {
      const filename = extractFilenameFromUrl('https://example.com/path/')
      expect(filename).toBe('chromium-download.zip')
    })

    it('should handle URLs with query parameters', () => {
      const filename = extractFilenameFromUrl('https://example.com/chrome-linux64.zip?version=120')
      expect(filename).toBe('chrome-linux64.zip')
    })
  })

  describe('findPlatformDownload', () => {
    const downloads = [
      { platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' },
      { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64.zip' },
      { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' },
    ]

    it('should find download for existing platform', () => {
      const download = findPlatformDownload(downloads, 'mac-arm64')
      expect(download).toEqual({
        platform: 'mac-arm64',
        url: 'https://example.com/chrome-mac-arm64.zip',
      })
    })

    it('should return null for non-existing platform', () => {
      const download = findPlatformDownload(downloads, 'win64')
      expect(download).toBeNull()
    })

    it('should handle empty downloads array', () => {
      const download = findPlatformDownload([], 'linux64')
      expect(download).toBeNull()
    })
  })

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      const startTime = Date.now() - 1000 // 1 second ago
      const progress = calculateProgress(500, 1000, startTime)

      expect(progress.total).toBe(1000)
      expect(progress.downloaded).toBe(500)
      expect(progress.percentage).toBe(50)
      expect(progress.speed).toBeGreaterThan(0)
    })

    it('should handle zero total', () => {
      const startTime = Date.now()
      const progress = calculateProgress(100, 0, startTime)

      expect(progress.total).toBe(0)
      expect(progress.downloaded).toBe(100)
      expect(progress.percentage).toBe(0)
    })

    it('should handle zero elapsed time', () => {
      const startTime = Date.now()
      const progress = calculateProgress(100, 1000, startTime)

      expect(progress.speed).toBe(0)
    })
  })

  describe('findLatestVersion', () => {
    const versions: BrowserVersion[] = [
      {
        kind: 'chromium',
        version: '120.0.6099.109',
        revision: '1234567',
        downloads: { chrome: [] },
      },
      {
        kind: 'chromium',
        version: '121.0.6167.85',
        revision: '1234568',
        downloads: { chrome: [] },
      },
      {
        kind: 'chromium',
        version: '119.0.6045.105',
        revision: '1234566',
        downloads: { chrome: [] },
      },
    ]

    it('should return the latest version', () => {
      const latest = findLatestVersion(versions)
      expect(latest?.version).toBe('121.0.6167.85')
    })

    it('should return null for empty array', () => {
      const latest = findLatestVersion([])
      expect(latest).toBeNull()
    })

    it('should handle single version', () => {
      const latest = findLatestVersion([versions[0]])
      expect(latest?.version).toBe(versions[0].version)
    })
  })

  describe('findVersionByString', () => {
    const versions: BrowserVersion[] = [
      {
        kind: 'chromium',
        version: '120.0.6099.109',
        revision: '1234567',
        downloads: { chrome: [] },
      },
      {
        kind: 'chromium',
        version: '121.0.6167.85',
        revision: '1234568',
        downloads: { chrome: [] },
      },
    ]

    it('should find existing version', () => {
      const found = findVersionByString(versions, '120.0.6099.109')
      expect(found).toEqual(versions[0])
    })

    it('should return null for non-existing version', () => {
      const found = findVersionByString(versions, '999.0.0.0')
      expect(found).toBeNull()
    })
  })

  describe('transformApiResponse', () => {
    it('should transform valid API response', () => {
      const apiResponse = {
        timestamp: '2024-01-01T00:00:00.000Z',
        versions: [
          {
            kind: 'chromium',
            version: '120.0.6099.109',
            revision: '1234567',
            downloads: {
              chrome: [{ platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' }],
            },
          },
        ],
      }

      const result = transformApiResponse(apiResponse)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        kind: 'chromium',
        version: '120.0.6099.109',
        revision: '1234567',
        downloads: {
          chrome: [{ platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' }],
        },
      })
    })

    it('should handle invalid response', () => {
      const result = transformApiResponse({})
      expect(result).toEqual([])
    })

    it('should handle response with non-array versions', () => {
      const result = transformApiResponse({ versions: 'not-an-array' })
      expect(result).toEqual([])
    })
  })
})
