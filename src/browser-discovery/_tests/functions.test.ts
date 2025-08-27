import { describe, expect, it } from 'vitest'
import { BrowserInstallation } from '../BrowserInstallation.js'
import {
  compareVersions,
  filterBrowsersBySource,
  filterBrowsersByVersion,
  generateDebugPortCheckCommand,
  generateExecutablePaths,
  parseVersionFromOutput,
  selectBestBrowser,
} from '../functions.js'

describe('Browser Discovery Functions', () => {
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

  describe('filterBrowsersByVersion', () => {
    const browsers = [
      new BrowserInstallation('/path/chrome1', '119.0.6045.105', 'system'),
      new BrowserInstallation('/path/chrome2', '120.0.6099.109', 'managed'),
      new BrowserInstallation('/path/chrome3', '121.0.6167.85', 'managed'),
    ]

    it('should return all browsers when no minimum version specified', () => {
      const result = filterBrowsersByVersion(browsers)
      expect(result).toHaveLength(3)
      expect(result).toEqual(browsers)
    })

    it('should filter browsers by minimum version', () => {
      const result = filterBrowsersByVersion(browsers, '120.0.0.0')
      expect(result).toHaveLength(2)
      expect(result[0].version).toBe('120.0.6099.109')
      expect(result[1].version).toBe('121.0.6167.85')
    })

    it('should return empty array when no browsers meet minimum version', () => {
      const result = filterBrowsersByVersion(browsers, '122.0.0.0')
      expect(result).toHaveLength(0)
    })
  })

  describe('filterBrowsersBySource', () => {
    const browsers = [
      new BrowserInstallation('/path/chrome1', '119.0.6045.105', 'system'),
      new BrowserInstallation('/path/chrome2', '120.0.6099.109', 'managed'),
      new BrowserInstallation('/path/chrome3', '121.0.6167.85', 'managed'),
    ]

    it('should return all browsers when skipLocal is false', () => {
      const result = filterBrowsersBySource(browsers, false)
      expect(result).toHaveLength(3)
      expect(result).toEqual(browsers)
    })

    it('should filter out system browsers when skipLocal is true', () => {
      const result = filterBrowsersBySource(browsers, true)
      expect(result).toHaveLength(2)
      expect(result[0].source).toBe('managed')
      expect(result[1].source).toBe('managed')
    })

    it('should return empty array when all browsers are system and skipLocal is true', () => {
      const systemBrowsers = [
        new BrowserInstallation('/path/chrome1', '119.0.6045.105', 'system'),
        new BrowserInstallation('/path/chrome2', '120.0.6099.109', 'system'),
      ]
      const result = filterBrowsersBySource(systemBrowsers, true)
      expect(result).toHaveLength(0)
    })
  })

  describe('selectBestBrowser', () => {
    it('should return null for empty array', () => {
      const result = selectBestBrowser([])
      expect(result).toBeNull()
    })

    it('should prefer managed browsers over system browsers', () => {
      const browsers = [
        new BrowserInstallation('/path/chrome1', '121.0.6167.85', 'system'),
        new BrowserInstallation('/path/chrome2', '120.0.6099.109', 'managed'),
      ]
      const result = selectBestBrowser(browsers)
      expect(result?.source).toBe('managed')
      expect(result?.version).toBe('120.0.6099.109')
    })

    it('should select highest version among managed browsers', () => {
      const browsers = [
        new BrowserInstallation('/path/chrome1', '120.0.6099.109', 'managed'),
        new BrowserInstallation('/path/chrome2', '121.0.6167.85', 'managed'),
        new BrowserInstallation('/path/chrome3', '119.0.6045.105', 'managed'),
      ]
      const result = selectBestBrowser(browsers)
      expect(result?.version).toBe('121.0.6167.85')
    })

    it('should select highest version system browser when no managed browsers available', () => {
      const browsers = [
        new BrowserInstallation('/path/chrome1', '120.0.6099.109', 'system'),
        new BrowserInstallation('/path/chrome2', '119.0.6045.105', 'system'),
      ]
      const result = selectBestBrowser(browsers)
      expect(result?.version).toBe('120.0.6099.109')
      expect(result?.source).toBe('system')
    })
  })

  describe('generateExecutablePaths', () => {
    it('should generate paths for Linux/macOS platform', () => {
      const paths = generateExecutablePaths('/test/dir', 'linux')
      expect(paths).toContain('/test/dir/chrome')
      expect(paths).toContain('/test/dir/chromium')
      expect(paths).toContain('/test/dir/bin/chrome')
      expect(paths).toContain('/test/dir/chrome-linux/chrome')
      expect(paths).not.toContain('/test/dir/chrome.exe')
    })

    it('should generate paths for Windows platform', () => {
      const paths = generateExecutablePaths('/test/dir', 'win32')
      expect(paths).toContain('/test/dir/chrome.exe')
      expect(paths).toContain('/test/dir/chromium.exe')
      expect(paths).toContain('/test/dir/bin/chrome.exe')
      expect(paths).toContain('/test/dir/chrome-win/chrome.exe')
      expect(paths).not.toContain('/test/dir/chrome')
    })

    it('should use current platform by default', () => {
      const paths = generateExecutablePaths('/test/dir')
      expect(paths.length).toBeGreaterThan(0)
      // Should contain platform-appropriate executables
      if (process.platform === 'win32') {
        expect(paths.some((p) => p.endsWith('.exe'))).toBe(true)
      } else {
        expect(paths.some((p) => p.endsWith('chrome') || p.endsWith('chromium'))).toBe(true)
      }
    })
  })

  describe('parseVersionFromOutput', () => {
    it('should parse version from Chromium output', () => {
      const output = 'Chromium 120.0.6099.109'
      const result = parseVersionFromOutput(output)
      expect(result).toBe('120.0.6099.109')
    })

    it('should parse version from Chrome output', () => {
      const output = 'Google Chrome 121.0.6167.85'
      const result = parseVersionFromOutput(output)
      expect(result).toBe('121.0.6167.85')
    })

    it('should handle output with extra whitespace', () => {
      const output = '  Chromium 120.0.6099.109  \n'
      const result = parseVersionFromOutput(output)
      expect(result).toBe('120.0.6099.109')
    })

    it('should return unknown for unparseable output', () => {
      const output = 'Invalid version output'
      const result = parseVersionFromOutput(output)
      expect(result).toBe('unknown')
    })

    it('should return unknown for empty output', () => {
      const output = ''
      const result = parseVersionFromOutput(output)
      expect(result).toBe('unknown')
    })
  })

  describe('generateDebugPortCheckCommand', () => {
    it('should generate curl command for Linux/macOS', () => {
      const command = generateDebugPortCheckCommand(9222, 'linux')
      expect(command).toBe(
        'curl -s --connect-timeout 2 http://localhost:9222/json/version > /dev/null',
      )
    })

    it('should generate PowerShell command for Windows', () => {
      const command = generateDebugPortCheckCommand(9222, 'win32')
      expect(command).toContain('powershell')
      expect(command).toContain('Invoke-WebRequest')
      expect(command).toContain('http://localhost:9222/json/version')
    })

    it('should use custom port number', () => {
      const command = generateDebugPortCheckCommand(8080, 'linux')
      expect(command).toContain('localhost:8080')
    })

    it('should use current platform by default', () => {
      const command = generateDebugPortCheckCommand(9222)
      expect(command).toContain('localhost:9222')
      if (process.platform === 'win32') {
        expect(command).toContain('powershell')
      } else {
        expect(command).toContain('curl')
      }
    })
  })
})
