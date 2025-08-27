import { existsSync } from 'node:fs'
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compareVersions } from '../../chrome-for-testing/core.js'
import type { BrowserVersion } from '../../chrome-for-testing/types.js'
import {
  ConcreteFileSystemOperations,
  type FileSystemOperations,
  type ProcessOperations,
} from '../../io/index.js'
import { BrowserInstallation } from '../BrowserInstallation.js'
import {
  type BrowserInstallationFactory,
  BrowserManagerService,
  type ChromeForTestingApiInterface,
  findExecutableInDirectory,
  findExecutableRecursively,
} from '../BrowserManagerService.js'

describe('BrowserManagerService', () => {
  let service: BrowserManagerService
  let tempDir: string
  let mockChromeForTestingApi: ChromeForTestingApiInterface
  let mockFileSystem: FileSystemOperations
  let mockProcess: ProcessOperations
  let mockBrowserFactory: BrowserInstallationFactory

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = join(
      tmpdir(),
      `browser-manager-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    )
    await mkdir(tempDir, { recursive: true })

    const managedInstallPath = join(tempDir, '.puppeteer-mcp', 'chromium')

    // Create mock dependencies
    mockChromeForTestingApi = {
      findVersion: vi.fn(),
      getLatestVersion: vi.fn(),
      downloadChromium: vi.fn(),
    }

    mockFileSystem = new ConcreteFileSystemOperations()

    mockProcess = {
      execSync: vi.fn().mockReturnValue('Chromium 120.0.6099.109'),
      getEnv: vi.fn().mockImplementation((key: string) => process.env[key]),
    }

    mockBrowserFactory = {
      create: vi
        .fn()
        .mockImplementation(
          (path: string, version: string, source: 'system' | 'managed', verified = false) => {
            const installation = new BrowserInstallation(path, version, source, verified)
            // Mock the verify method to return true by default
            vi.spyOn(installation, 'verify').mockResolvedValue(true)
            return installation
          },
        ),
    }

    // Create service instance with injected dependencies
    service = new BrowserManagerService(
      mockChromeForTestingApi,
      mockFileSystem,
      mockProcess,
      mockBrowserFactory,
      managedInstallPath,
    )
  })

  afterEach(async () => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true })
    }

    // Restore all mocks
    vi.restoreAllMocks()
  })

  describe('installChromium', () => {
    const mockVersion: BrowserVersion = {
      kind: 'chromium',
      version: '120.0.6099.109',
      revision: '1234567',
      downloads: {
        chrome: [
          {
            platform: 'linux64',
            url: 'https://example.com/chrome-linux64.zip',
          },
        ],
      },
    }

    it('should install latest version when no version specified', async () => {
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109')
      const downloadPath = join(versionDir, 'chrome-linux64.zip')
      const executablePath = join(versionDir, 'chrome')

      // Setup mocks
      mockChromeForTestingApi.getLatestVersion = vi.fn().mockResolvedValue(mockVersion)
      mockChromeForTestingApi.downloadChromium = vi.fn().mockResolvedValue({
        success: true,
        filePath: downloadPath,
      })

      ;(service as any).extractArchive = vi.fn().mockResolvedValue(versionDir)
      ;(service as any).findExecutableInExtraction = vi.fn().mockResolvedValue(executablePath)

      const result = await service.installChromium()

      expect(result.success).toBe(true)
      expect(result.version).toBe('120.0.6099.109')
      expect(result.path).toBe(executablePath)
      expect(mockChromeForTestingApi.getLatestVersion).toHaveBeenCalled()
      expect(mockChromeForTestingApi.downloadChromium).toHaveBeenCalledWith(
        mockVersion,
        expect.objectContaining({
          destinationDir: versionDir,
          timeout: 600_000,
        }),
      )
    })

    it('should install specific version when requested', async () => {
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109')
      const downloadPath = join(versionDir, 'chrome-linux64.zip')
      const executablePath = join(versionDir, 'chrome')

      // Setup mocks
      mockChromeForTestingApi.findVersion = vi.fn().mockResolvedValue(mockVersion)
      mockChromeForTestingApi.downloadChromium = vi.fn().mockResolvedValue({
        success: true,
        filePath: downloadPath,
      })

      ;(service as any).extractArchive = vi.fn().mockResolvedValue(versionDir)
      ;(service as any).findExecutableInExtraction = vi.fn().mockResolvedValue(executablePath)

      const result = await service.installChromium({ version: '120.0.6099.109' })

      expect(result.success).toBe(true)
      expect(result.version).toBe('120.0.6099.109')
      expect(mockChromeForTestingApi.findVersion).toHaveBeenCalledWith('120.0.6099.109')
    })

    it('should return error when version not found', async () => {
      mockChromeForTestingApi.findVersion = vi.fn().mockResolvedValue(null)

      const result = await service.installChromium({ version: '999.0.0.0' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Version 999.0.0.0 not found')
    })

    it('should return error when no versions available', async () => {
      mockChromeForTestingApi.getLatestVersion = vi.fn().mockResolvedValue(null)

      const result = await service.installChromium()

      expect(result.success).toBe(false)
      expect(result.error).toContain('No versions available')
    })

    it('should return error when download fails', async () => {
      mockChromeForTestingApi.getLatestVersion = vi.fn().mockResolvedValue(mockVersion)
      mockChromeForTestingApi.downloadChromium = vi.fn().mockResolvedValue({
        success: false,
        error: 'Network error',
      })

      const result = await service.installChromium()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should return existing installation if already installed and verified', async () => {
      // Create existing installation
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109')
      await mkdir(versionDir, { recursive: true })
      const executablePath = join(versionDir, 'chrome')
      await writeFile(executablePath, '#!/bin/bash\necho "mock chrome"')
      await chmod(executablePath, 0o755)

      mockChromeForTestingApi.findVersion = vi.fn().mockResolvedValue(mockVersion)

      const result = await service.installChromium({ version: '120.0.6099.109' })

      expect(result.success).toBe(true)
      expect(result.version).toBe('120.0.6099.109')
      expect(result.path).toBe(executablePath)
      expect(mockChromeForTestingApi.downloadChromium).not.toHaveBeenCalled()
    })

    it('should reinstall if existing installation fails verification', async () => {
      // Create existing installation
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109')
      await mkdir(versionDir, { recursive: true })
      const executablePath = join(versionDir, 'chrome')
      await writeFile(executablePath, '#!/bin/bash\necho "mock chrome"')
      await chmod(executablePath, 0o755)

      mockChromeForTestingApi.findVersion = vi.fn().mockResolvedValue(mockVersion)

      const downloadPath = join(versionDir, 'chrome-linux64.zip')

      mockChromeForTestingApi.downloadChromium = vi.fn().mockResolvedValue({
        success: true,
        filePath: downloadPath,
      })

      // Mock the browser factory to return installations with different verification results
      let verifyCallCount = 0
      mockBrowserFactory.create = vi
        .fn()
        .mockImplementation(
          (path: string, version: string, source: 'system' | 'managed', verified = false) => {
            const installation = new BrowserInstallation(path, version, source, verified)
            vi.spyOn(installation, 'verify').mockImplementation(async () => {
              verifyCallCount++
              return verifyCallCount > 1 // First call fails, second succeeds
            })
            return installation
          },
        )

      ;(service as any).extractArchive = vi.fn().mockResolvedValue(versionDir)
      ;(service as any).findExecutableInExtraction = vi.fn().mockResolvedValue(executablePath)

      const result = await service.installChromium({ version: '120.0.6099.109' })

      expect(result.success).toBe(true)
      expect(mockChromeForTestingApi.downloadChromium).toHaveBeenCalled()
    })

    it('should handle extraction errors', async () => {
      const downloadPath = join(tempDir, 'chrome-linux64.zip')

      ;(mockChromeForTestingApi.getLatestVersion as any).mockResolvedValue(mockVersion)
      ;(mockChromeForTestingApi.downloadChromium as any).mockResolvedValue({
        success: true,
        filePath: downloadPath,
      })

      // Mock extraction to throw error
      ;(service as any).extractArchive = vi.fn().mockRejectedValue(new Error('Extraction failed'))

      const result = await service.installChromium()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Installation failed')
    })
  })

  describe('cleanupOldVersions', () => {
    beforeEach(async () => {
      // Create multiple version directories
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium')
      await mkdir(chromiumDir, { recursive: true })

      const versions = ['118.0.5993.70', '119.0.6045.105', '120.0.6099.109', '121.0.6167.85']
      for (const version of versions) {
        const versionDir = join(chromiumDir, version)
        await mkdir(versionDir, { recursive: true })
        await writeFile(join(versionDir, 'chrome'), 'mock executable')
      }
    })

    it('should keep specified number of recent versions', async () => {
      const result = await service.cleanupOldVersions(2)

      expect(result.removedVersions).toHaveLength(2)
      expect(result.removedVersions).toContain('118.0.5993.70')
      expect(result.removedVersions).toContain('119.0.6045.105')

      // Check that newer versions still exist
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium')
      expect(existsSync(join(chromiumDir, '120.0.6099.109'))).toBe(true)
      expect(existsSync(join(chromiumDir, '121.0.6167.85'))).toBe(true)
    })

    it('should not remove versions when count is below threshold', async () => {
      const result = await service.cleanupOldVersions(5)

      expect(result.removedVersions).toHaveLength(0)
    })

    it('should handle non-existent directory gracefully', async () => {
      // Remove the chromium directory
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium')
      await rm(chromiumDir, { recursive: true, force: true })

      const result = await service.cleanupOldVersions()

      expect(result.removedVersions).toHaveLength(0)
    })

    it('should ignore non-version directories', async () => {
      // Create non-version directory
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium')
      await mkdir(join(chromiumDir, 'not-a-version'), { recursive: true })

      const result = await service.cleanupOldVersions(2)

      // Should still remove 2 oldest versions, ignoring the non-version directory
      expect(result.removedVersions).toHaveLength(2)
    })
  })

  describe('createInstallation', () => {
    it('should create installation from managed path', async () => {
      const executablePath = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109', 'chrome')

      const installation = await service.createInstallation(executablePath)

      expect(installation.path).toBe(executablePath)
      expect(installation.version).toBe('120.0.6099.109')
      expect(installation.source).toBe('managed')
    })

    it('should create installation from system path', async () => {
      const executablePath = '/usr/bin/chromium'

      // Mock process execSync to return version
      mockProcess.execSync = vi.fn().mockReturnValue('Chromium 119.0.6045.105')

      const installation = await service.createInstallation(executablePath)

      expect(installation.path).toBe(executablePath)
      expect(installation.version).toBe('119.0.6045.105')
      expect(installation.source).toBe('system')
    })

    it('should handle version detection failure', async () => {
      const executablePath = '/usr/bin/chromium'

      // Mock process execSync to throw error
      mockProcess.execSync = vi.fn().mockImplementation(() => {
        throw new Error('Command failed')
      })

      const installation = await service.createInstallation(executablePath)

      expect(installation.path).toBe(executablePath)
      expect(installation.version).toBe('unknown')
      expect(installation.source).toBe('system')
    })
  })

  describe('utility functions for installation discovery', () => {
    it('should compare versions correctly', async () => {
      expect(compareVersions('120.0.6099.109', '119.0.6045.105')).toBeGreaterThan(0)
      expect(compareVersions('119.0.6045.105', '120.0.6099.109')).toBeLessThan(0)
      expect(compareVersions('120.0.6099.109', '120.0.6099.109')).toBe(0)
      expect(compareVersions('120.0.6099.109', '120.0.6099.110')).toBeLessThan(0)
    })

    it('should find executable in directory', async () => {
      const testDir = join(tempDir, 'test-browser')
      await mkdir(testDir, { recursive: true })

      const executablePath = join(testDir, 'chrome')
      await writeFile(executablePath, 'mock executable')
      await chmod(executablePath, 0o755)

      const found = findExecutableInDirectory(new ConcreteFileSystemOperations(), testDir)
      expect(found).toBe(executablePath)
    })

    it('should find executable recursively', async () => {
      const testDir = join(tempDir, 'test-browser')
      const subDir = join(testDir, 'bin')
      await mkdir(subDir, { recursive: true })

      const executablePath = join(subDir, 'chrome')
      await writeFile(executablePath, 'mock executable')
      await chmod(executablePath, 0o755)

      const found = await findExecutableRecursively(new ConcreteFileSystemOperations(), testDir, [
        'chrome',
      ])
      expect(found).toBe(executablePath)
    })
  })
})
