import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNotNull } from '../../test-utils/index.js'
import { BrowserDiscoveryService } from '../BrowserDiscoveryService.js'
import { BrowserInstallation } from '../BrowserInstallation.js'

describe('BrowserDiscoveryService', () => {
  let service: BrowserDiscoveryService
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Create service instance
    service = new BrowserDiscoveryService()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('discoverBrowsers', () => {
    it('should return an array of browser installations', async () => {
      const browsers = await service.discoverBrowsers()

      expect(Array.isArray(browsers)).toBe(true)
      // Each browser should be a BrowserInstallation instance
      browsers.forEach((browser) => {
        expect(browser).toBeInstanceOf(BrowserInstallation)
        expect(typeof browser.path).toBe('string')
        expect(typeof browser.version).toBe('string')
        expect(['system', 'managed']).toContain(browser.source)
        expect(typeof browser.verified).toBe('boolean')
      })
    })

    it('should respect DISABLE_LOCAL_CHROMIUM_DISCOVERY environment variable with "1"', async () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = '1'

      const browsers = await service.discoverBrowsers()

      // Should not find system browsers when disabled
      const systemBrowsers = browsers.filter((b) => b.source === 'system')
      expect(systemBrowsers).toHaveLength(0)
    })

    it('should respect DISABLE_LOCAL_CHROMIUM_DISCOVERY environment variable with "true"', async () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = 'true'

      const browsers = await service.discoverBrowsers()

      // Should not find system browsers when disabled
      const systemBrowsers = browsers.filter((b) => b.source === 'system')
      expect(systemBrowsers).toHaveLength(0)
    })

    it('should respect DISABLE_LOCAL_CHROMIUM_DISCOVERY environment variable with "T"', async () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = 'T'

      const browsers = await service.discoverBrowsers()

      // Should not find system browsers when disabled
      const systemBrowsers = browsers.filter((b) => b.source === 'system')
      expect(systemBrowsers).toHaveLength(0)
    })

    it('should not disable when DISABLE_LOCAL_CHROMIUM_DISCOVERY is "false"', async () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = 'false'

      const browsers = await service.discoverBrowsers()

      // Should still find system browsers when set to "false"
      // (since it doesn't start with 1, t, or T)
      expect(Array.isArray(browsers)).toBe(true)
    })

    it('should not disable when DISABLE_LOCAL_CHROMIUM_DISCOVERY is "0"', async () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = '0'

      const browsers = await service.discoverBrowsers()

      // Should still find system browsers when set to "0"
      // (since it doesn't start with 1, t, or T)
      expect(Array.isArray(browsers)).toBe(true)
    })

    it('should handle errors gracefully', async () => {
      // This should not throw even if there are issues with discovery
      const browsers = await service.discoverBrowsers()
      expect(Array.isArray(browsers)).toBe(true)
    })
  })

  describe('findBestBrowser', () => {
    it('should return a browser installation or null', async () => {
      const browser = await service.findBestBrowser()

      if (browser !== null) {
        expect(browser).toBeInstanceOf(BrowserInstallation)
        expect(typeof browser.path).toBe('string')
        expect(typeof browser.version).toBe('string')
        expect(['system', 'managed']).toContain(browser.source)
      }
    })

    it('should handle minimum version filtering', async () => {
      const browser = await service.findBestBrowser({ minVersion: '999.0.0.0' })

      // With an impossibly high version requirement, should return null
      expect(browser).toBeNull()
    })

    it('should handle skipLocal option', async () => {
      const browser = await service.findBestBrowser({ skipLocal: true })

      if (browser !== null) {
        expect(browser.source).toBe('managed')
      }
    })

    it('should handle empty browser list', async () => {
      // Mock discoverBrowsers to return empty array
      vi.spyOn(service, 'discoverBrowsers').mockResolvedValue([])

      const browser = await service.findBestBrowser()
      expect(browser).toBeNull()
    })
  })

  describe('checkRunningBrowser', () => {
    it('should return a boolean', async () => {
      const isRunning = await service.checkRunningBrowser()

      expect(typeof isRunning).toBe('boolean')
    })

    it('should handle custom port', async () => {
      const isRunning = await service.checkRunningBrowser({ port: 9223 })

      expect(typeof isRunning).toBe('boolean')
    })

    it('should handle connection failures gracefully', async () => {
      // This should not throw even if the connection fails
      const isRunning = await service.checkRunningBrowser({ port: 99_999 })

      expect(typeof isRunning).toBe('boolean')
      // Most likely false since port 99999 is unlikely to be in use
      expect(isRunning).toBe(false)
    })
  })

  describe('version comparison logic', () => {
    it('should handle version comparison correctly', async () => {
      // Mock discoverBrowsers to return browsers with different versions
      vi.spyOn(service, 'discoverBrowsers').mockResolvedValue([
        new BrowserInstallation('/path1', '120.0.6099.109', 'managed', false),
        new BrowserInstallation('/path2', '121.0.6167.85', 'managed', false),
        new BrowserInstallation('/path3', '119.0.6045.105', 'managed', false),
      ])

      const browser = expectNotNull(await service.findBestBrowser())

      expect(browser.version).toBe('121.0.6167.85')
    })

    it('should handle unknown versions gracefully', async () => {
      vi.spyOn(service, 'discoverBrowsers').mockResolvedValue([
        new BrowserInstallation('/path1', 'unknown', 'managed', false),
        new BrowserInstallation('/path2', '120.0.6099.109', 'managed', false),
      ])

      const browser = expectNotNull(await service.findBestBrowser())
      expect(browser.version).toBe('120.0.6099.109')
    })

    it('should prefer managed browsers over system browsers', async () => {
      vi.spyOn(service, 'discoverBrowsers').mockResolvedValue([
        new BrowserInstallation('/usr/bin/chromium', '122.0.0.0', 'system', false),
        new BrowserInstallation('/managed/path', '121.0.0.0', 'managed', false),
      ])

      const browser = expectNotNull(await service.findBestBrowser())
      expect(browser.source).toBe('managed')
      expect(browser.version).toBe('121.0.0.0')
    })
  })

  describe('service instantiation and basic functionality', () => {
    it('should create a service instance', () => {
      expect(service).toBeInstanceOf(BrowserDiscoveryService)
    })

    it('should have all required methods', () => {
      expect(typeof service.discoverBrowsers).toBe('function')
      expect(typeof service.findBestBrowser).toBe('function')
      expect(typeof service.checkRunningBrowser).toBe('function')
    })

    it('should handle concurrent calls gracefully', async () => {
      const promises = [
        service.discoverBrowsers(),
        service.findBestBrowser(),
        service.checkRunningBrowser(),
      ]

      const results = await Promise.all(promises)

      expect(Array.isArray(results[0])).toBe(true) // discoverBrowsers result
      expect(results[1] === null || results[1] instanceof BrowserInstallation).toBe(true) // findBestBrowser result
      expect(typeof results[2]).toBe('boolean') // checkRunningBrowser result
    })
  })
})
