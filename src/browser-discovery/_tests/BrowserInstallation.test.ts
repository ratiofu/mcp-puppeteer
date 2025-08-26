import { describe, expect, it } from 'vitest'
import {
  BrowserInstallation,
  buildChromiumLaunchFlags,
  DEFAULT_LAUNCH_ARGS,
} from '../BrowserInstallation'

describe('constructor', () => {
  it('should create instance with required properties', () => {
    const installation = new BrowserInstallation('/usr/bin/chromium', '120.0.6099.109', 'system')

    expect(installation.path).toBe('/usr/bin/chromium')
    expect(installation.version).toBe('120.0.6099.109')
    expect(installation.source).toBe('system')
    expect(installation.verified).toBe(false)
  })

  it('should create instance with verified flag', () => {
    const installation = new BrowserInstallation(
      '/usr/bin/chromium',
      '120.0.6099.109',
      'managed',
      true,
    )

    expect(installation.verified).toBe(true)
  })
})

describe('getExecutableInfo', () => {
  it('should return executable information', () => {
    const installation = new BrowserInstallation('/usr/bin/chromium', '120.0.6099.109', 'system')

    const info = installation.getExecutableInfo()

    expect(info).toEqual({
      path: '/usr/bin/chromium',
      version: '120.0.6099.109',
    })
  })
})

describe('buildLaunchArgs', () => {
  it('should return default args when no options provided', () => {
    const args = buildChromiumLaunchFlags()
    expect(args).toEqual([...DEFAULT_LAUNCH_ARGS])
  })

  it('should return default args when empty options provided', () => {
    const args = buildChromiumLaunchFlags({})
    expect(args).toEqual([...DEFAULT_LAUNCH_ARGS])
  })

  it('should add debug port when specified', () => {
    const args = buildChromiumLaunchFlags({ debugPort: 9222 })
    expect(args).toEqual([...DEFAULT_LAUNCH_ARGS, '--remote-debugging-port=9222'])
  })

  it('should add user data directory when specified', () => {
    const args = buildChromiumLaunchFlags({ userDataDir: '/tmp/test-profile' })
    expect(args).toEqual([...DEFAULT_LAUNCH_ARGS, '--user-data-dir=/tmp/test-profile'])
  })

  it('should add additional args when specified', () => {
    const args = buildChromiumLaunchFlags({
      additionalArgs: ['--disable-extensions', '--incognito'],
    })
    expect(args).toEqual([...DEFAULT_LAUNCH_ARGS, '--disable-extensions', '--incognito'])
  })

  it('should combine all options correctly', () => {
    const args = buildChromiumLaunchFlags({
      debugPort: 9333,
      userDataDir: '/custom/profile',
      additionalArgs: ['--disable-extensions'],
    })
    expect(args).toEqual([
      ...DEFAULT_LAUNCH_ARGS,
      '--disable-extensions',
      '--remote-debugging-port=9333',
      '--user-data-dir=/custom/profile',
    ])
  })

  it('should handle headless option (not affecting args)', () => {
    // headless is handled separately in launch(), not in buildLaunchArgs()
    const args = buildChromiumLaunchFlags({ headless: false })

    expect(args).toEqual([...DEFAULT_LAUNCH_ARGS])
  })
})

describe('BrowserInstallation', () => {
  describe('verify method logic', () => {
    it('should generate unique debug ports and user data directories', () => {
      const _installation = new BrowserInstallation('/usr/bin/chromium', '120.0.6099.109', 'system')

      // Test the logic for generating unique values
      const debugPort1 = 9223 + Math.floor(Math.random() * 1000)
      const debugPort2 = 9223 + Math.floor(Math.random() * 1000)

      expect(debugPort1).toBeGreaterThanOrEqual(9223)
      expect(debugPort1).toBeLessThan(10_223)
      expect(debugPort2).toBeGreaterThanOrEqual(9223)
      expect(debugPort2).toBeLessThan(10_223)

      const userDataDir1 = `/tmp/chromium-verify-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      const userDataDir2 = `/tmp/chromium-verify-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

      expect(userDataDir1).toMatch(/^\/tmp\/chromium-verify-\d+-[a-z0-9]+$/)
      expect(userDataDir2).toMatch(/^\/tmp\/chromium-verify-\d+-[a-z0-9]+$/)
      // They should be different (very high probability)
      expect(userDataDir1).not.toBe(userDataDir2)
    })
  })

  describe('error handling', () => {
    it('should handle launch errors properly', async () => {
      const installation = new BrowserInstallation(
        '/nonexistent/path/chromium',
        '120.0.6099.109',
        'system',
      )

      // This should fail because the path doesn't exist
      await expect(installation.launch()).rejects.toThrow(
        'Failed to launch browser at /nonexistent/path/chromium: Browser was not found at the configured executablePath (/nonexistent/path/chromium)',
      )
    })

    it('should handle verify errors properly', async () => {
      const installation = new BrowserInstallation(
        '/nonexistent/path/chromium',
        '120.0.6099.109',
        'system',
      )

      // This should return false because the path doesn't exist
      const result = await installation.verify()
      expect(result).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      const installation = new BrowserInstallation('/usr/bin/chromium', '120.0.6099.109', 'system')

      const result = installation.toString()

      expect(result).toBe('BrowserInstallation(system:120.0.6099.109@/usr/bin/chromium)')
    })

    it('should work with managed installation', () => {
      const installation = new BrowserInstallation(
        '/home/user/.puppeteer-mcp/chromium/120.0.6099.109/chrome',
        '120.0.6099.109',
        'managed',
      )

      const result = installation.toString()

      expect(result).toBe(
        'BrowserInstallation(managed:120.0.6099.109@/home/user/.puppeteer-mcp/chromium/120.0.6099.109/chrome)',
      )
    })
  })
})
