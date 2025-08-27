import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserDiscoveryService } from '../BrowserDiscoveryService.js'
import { BrowserInstallation } from '../BrowserInstallation.js'

describe('BrowserDiscoveryService', () => {
  let service: BrowserDiscoveryService
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }
    service = new BrowserDiscoveryService()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('service integration', () => {
    it('should create a service instance with required methods', () => {
      expect(service).toBeInstanceOf(BrowserDiscoveryService)
      expect(typeof service.discoverBrowsers).toBe('function')
      expect(typeof service.findBestBrowser).toBe('function')
      expect(typeof service.checkRunningBrowser).toBe('function')
    })

    it('should discover browsers and return valid installations', async () => {
      const browsers = await service.discoverBrowsers()

      expect(Array.isArray(browsers)).toBe(true)
      browsers.forEach((browser) => {
        expect(browser).toBeInstanceOf(BrowserInstallation)
        expect(typeof browser.path).toBe('string')
        expect(typeof browser.version).toBe('string')
        expect(['system', 'managed']).toContain(browser.source)
        expect(typeof browser.verified).toBe('boolean')
      })
    })

    it('should respect DISABLE_LOCAL_CHROMIUM_DISCOVERY environment variable', async () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = '1'

      const browsers = await service.discoverBrowsers()
      const systemBrowsers = browsers.filter((b) => b.source === 'system')
      expect(systemBrowsers).toHaveLength(0)
    })

    it('should integrate with pure functions for browser selection', async () => {
      // Mock discoverBrowsers to test integration with pure functions
      vi.spyOn(service, 'discoverBrowsers').mockResolvedValue([
        new BrowserInstallation('/usr/bin/chromium', '122.0.0.0', 'system', false),
        new BrowserInstallation('/managed/path', '121.0.0.0', 'managed', false),
      ])

      const browser = await service.findBestBrowser()

      // Should prefer managed browser (logic tested in functions.test.ts)
      expect(browser?.source).toBe('managed')
      expect(browser?.version).toBe('121.0.0.0')
    })

    it('should handle empty browser discovery gracefully', async () => {
      vi.spyOn(service, 'discoverBrowsers').mockResolvedValue([])

      const browser = await service.findBestBrowser()
      expect(browser).toBeNull()
    })
  })

  describe('I/O operations', () => {
    it('should check running browser via network call', async () => {
      const isRunning = await service.checkRunningBrowser()
      expect(typeof isRunning).toBe('boolean')
    })

    it('should handle network failures gracefully', async () => {
      // Use unlikely port to ensure connection failure
      const isRunning = await service.checkRunningBrowser(99_999)
      expect(isRunning).toBe(false)
    })

    it('should handle discovery errors gracefully', async () => {
      // Should not throw even if there are issues with discovery
      const browsers = await service.discoverBrowsers()
      expect(Array.isArray(browsers)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle missing managed browser directory', async () => {
      // Create service with non-existent managed install path
      const mockFs = {
        existsSync: vi.fn().mockReturnValue(false),
        readdir: vi.fn(),
        stat: vi.fn(),
        mkdir: vi.fn(),
        rm: vi.fn(),
      }
      const mockProcess = {
        execSync: vi.fn(),
        getEnv: vi.fn().mockReturnValue(undefined),
      }

      const testService = new BrowserDiscoveryService(mockProcess, mockFs)
      const browsers = await testService.discoverBrowsers()

      // Should handle missing directory gracefully
      expect(Array.isArray(browsers)).toBe(true)
      expect(mockFs.readdir).not.toHaveBeenCalled()
    })

    it('should handle version parsing failures', async () => {
      // Mock process to return unparseable version output
      const mockProcess = {
        execSync: vi
          .fn()
          .mockReturnValueOnce('') // First call for findChromiumExecutable
          .mockReturnValueOnce('Invalid version output'), // Second call for getBrowserVersion
        getEnv: vi.fn().mockReturnValue(undefined),
      }
      const mockFs = {
        existsSync: vi.fn().mockReturnValue(false),
        readdir: vi.fn(),
        stat: vi.fn(),
        mkdir: vi.fn(),
        rm: vi.fn(),
      }

      // Mock findChromiumExecutable to return a path
      vi.doMock('../findChromiumExecutable.js', () => ({
        findChromiumExecutable: vi.fn().mockReturnValue('/mock/chrome'),
      }))

      const testService = new BrowserDiscoveryService(mockProcess, mockFs)
      const browsers = await testService.discoverBrowsers()

      // Should handle version parsing failure and still return browser with 'unknown' version
      expect(Array.isArray(browsers)).toBe(true)
      // The system browser should still be discovered even with version parsing failure
      const systemBrowser = browsers.find((b) => b.source === 'system')
      if (systemBrowser) {
        expect(systemBrowser.version).toBe('unknown')
      }
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent calls without interference', async () => {
      const promises = [
        service.discoverBrowsers(),
        service.findBestBrowser(),
        service.checkRunningBrowser(),
      ]

      const results = await Promise.all(promises)

      expect(Array.isArray(results[0])).toBe(true)
      expect(results[1] === null || results[1] instanceof BrowserInstallation).toBe(true)
      expect(typeof results[2]).toBe('boolean')
    })
  })
})
