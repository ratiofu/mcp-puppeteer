import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as envUtils from '../../browser-discovery/envUtils.js'
import { ChromeForTestingApi } from '../ChromeForTestingApi.js'
import type { BrowserVersion, DownloadOptions } from '../types.js'
import { TestChromeForTestingOperations } from './test-operations.js'

describe('ChromeForTestingApi', () => {
  let api: ChromeForTestingApi
  let testOps: TestChromeForTestingOperations

  beforeEach(() => {
    testOps = new TestChromeForTestingOperations()
    api = new ChromeForTestingApi(testOps)
  })

  describe('getAvailableVersions', () => {
    it('should fetch and transform available versions successfully', async () => {
      const versions = await api.getAvailableVersions()

      expect(versions).toHaveLength(2)
      expect(versions[0]).toEqual({
        kind: 'chromium',
        version: '120.0.6099.109',
        revision: '1234567',
        downloads: {
          chrome: [
            { platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' },
            { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64.zip' },
            { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' },
          ],
        },
      })
    })

    it('should handle fetch errors', async () => {
      testOps.setShouldFailFetch(true)

      await expect(api.getAvailableVersions()).rejects.toThrow(
        'Failed to fetch available versions: Test fetch failure',
      )
    })

    it('should handle invalid response format', async () => {
      testOps.setVersionsResponse({ invalid: 'response' })

      const versions = await api.getAvailableVersions()
      expect(versions).toEqual([])
    })
  })

  describe('downloadChromium', () => {
    const mockVersion: BrowserVersion = {
      kind: 'chromium',
      version: '120.0.6099.109',
      revision: '1234567',
      downloads: {
        chrome: [
          { platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' },
          { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64.zip' },
          { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' },
        ],
      },
    }

    beforeEach(() => {
      // Mock platform detection to return supported platform
      vi.spyOn(envUtils, 'detectPlatform').mockReturnValue({
        platform: 'mac-arm64',
        name: 'macOS (Apple Silicon)',
        supported: true,
      })
    })

    it('should download successfully with progress tracking', async () => {
      const mockProgressCallback = vi.fn()
      const options: DownloadOptions = {
        destinationDir: '/tmp/test',
        onProgress: mockProgressCallback,
      }

      const result = await api.downloadChromium(mockVersion, options)

      expect(result.success).toBe(true)
      expect(result.filePath).toBe('/tmp/test/chrome-mac-arm64.zip')
      expect(mockProgressCallback).toHaveBeenCalledTimes(2)
    })

    it('should download successfully without progress tracking', async () => {
      const options: DownloadOptions = {
        destinationDir: '/tmp/test',
      }

      const result = await api.downloadChromium(mockVersion, options)

      expect(result.success).toBe(true)
      expect(result.filePath).toBe('/tmp/test/chrome-mac-arm64.zip')
    })

    it('should handle unsupported platform', async () => {
      vi.spyOn(envUtils, 'detectPlatform').mockReturnValue({
        platform: 'linux64',
        name: 'freebsd (x64)',
        supported: false,
      })

      const options: DownloadOptions = {
        destinationDir: '/tmp/test',
      }

      const result = await api.downloadChromium(mockVersion, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Platform freebsd (x64) is not supported')
    })

    it('should handle missing download URL for platform', async () => {
      const versionWithoutMacArm: BrowserVersion = {
        ...mockVersion,
        downloads: {
          chrome: [{ platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' }],
        },
      }

      const options: DownloadOptions = {
        destinationDir: '/tmp/test',
      }

      const result = await api.downloadChromium(versionWithoutMacArm, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('No download URL available for macOS (Apple Silicon)')
    })

    it('should handle download failures', async () => {
      testOps.setShouldFailDownload(true)

      const options: DownloadOptions = {
        destinationDir: '/tmp/test',
      }

      const result = await api.downloadChromium(mockVersion, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Test download failure')
    })
  })

  describe('getLatestVersion', () => {
    it('should return the latest version', async () => {
      const latest = await api.getLatestVersion()
      expect(latest?.version).toBe('121.0.6167.85') // 121.0.6167.85 should be latest
    })

    it('should return null when no versions available', async () => {
      testOps.setVersionsResponse({ versions: [] })

      const latest = await api.getLatestVersion()
      expect(latest).toBeNull()
    })
  })

  describe('findVersion', () => {
    it('should find existing version', async () => {
      const found = await api.findVersion('120.0.6099.109')
      expect(found?.version).toBe('120.0.6099.109')
    })

    it('should return null for non-existing version', async () => {
      const found = await api.findVersion('999.0.0.0')
      expect(found).toBeNull()
    })
  })
})
