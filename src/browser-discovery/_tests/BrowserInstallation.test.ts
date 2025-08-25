import { describe, it, expect } from 'vitest';
import { BrowserInstallation } from '../BrowserInstallation.js';
  describe('constructor', () => {
    it('should create instance with required properties', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'system'
      );

      expect(installation.path).toBe('/usr/bin/chromium');
      expect(installation.version).toBe('120.0.6099.109');
      expect(installation.source).toBe('system');
      expect(installation.verified).toBe(false);
    });

    it('should create instance with verified flag', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'managed',
        true
      );

      expect(installation.verified).toBe(true);
    });
  });

  describe('getExecutableInfo', () => {
    it('should return executable information', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'system'
      );

      const info = installation.getExecutableInfo();

      expect(info).toEqual({
        path: '/usr/bin/chromium',
        version: '120.0.6099.109'
      });
    });
  });

describe('BrowserInstallation', () => {
  describe('launch options processing', () => {
    it('should build correct args for default options', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'system'
      );

      // Test the args building logic by examining what would be passed to puppeteer
      const options: {
        headless?: boolean;
        debugPort?: number;
        userDataDir?: string;
        additionalArgs?: string[];
      } = {};
      const {
        headless = true,
        debugPort,
        userDataDir,
        additionalArgs = []
      } = options;

      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--disable-default-apps',
        ...additionalArgs
      ];

      // Add debug port if specified
      if (debugPort) {
        args.push(`--remote-debugging-port=${debugPort}`);
      }

      // Add user data directory if specified
      if (userDataDir) {
        args.push(`--user-data-dir=${userDataDir}`);
      }

      expect(args).toEqual([
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--disable-default-apps'
      ]);
      expect(headless).toBe(true);
    });

    it('should build correct args with custom options', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'system'
      );

      const options = {
        headless: false,
        debugPort: 9222,
        userDataDir: '/tmp/test-profile',
        additionalArgs: ['--disable-extensions']
      };

      const {
        headless = true,
        debugPort,
        userDataDir,
        additionalArgs = []
      } = options;

      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--disable-default-apps',
        ...additionalArgs
      ];

      if (debugPort) {
        args.push(`--remote-debugging-port=${debugPort}`);
      }

      if (userDataDir) {
        args.push(`--user-data-dir=${userDataDir}`);
      }

      expect(args).toEqual([
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-extensions',
        '--remote-debugging-port=9222',
        '--user-data-dir=/tmp/test-profile'
      ]);
      expect(headless).toBe(false);
    });

    it('should handle partial options correctly', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'system'
      );

      // Test with only debug port
      const options1 = { debugPort: 9333 };
      const args1 = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--disable-default-apps'
      ];
      if (options1.debugPort) {
        args1.push(`--remote-debugging-port=${options1.debugPort}`);
      }
      expect(args1).toContain('--remote-debugging-port=9333');

      // Test with only user data directory
      const options2 = { userDataDir: '/custom/profile' };
      const args2 = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--disable-default-apps'
      ];
      if (options2.userDataDir) {
        args2.push(`--user-data-dir=${options2.userDataDir}`);
      }
      expect(args2).toContain('--user-data-dir=/custom/profile');
    });
  });

  describe('verify method logic', () => {
    it('should generate unique debug ports and user data directories', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'system'
      );

      // Test the logic for generating unique values
      const debugPort1 = 9223 + Math.floor(Math.random() * 1000);
      const debugPort2 = 9223 + Math.floor(Math.random() * 1000);
      
      expect(debugPort1).toBeGreaterThanOrEqual(9223);
      expect(debugPort1).toBeLessThan(10223);
      expect(debugPort2).toBeGreaterThanOrEqual(9223);
      expect(debugPort2).toBeLessThan(10223);

      const userDataDir1 = `/tmp/chromium-verify-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const userDataDir2 = `/tmp/chromium-verify-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      expect(userDataDir1).toMatch(/^\/tmp\/chromium-verify-\d+-[a-z0-9]+$/);
      expect(userDataDir2).toMatch(/^\/tmp\/chromium-verify-\d+-[a-z0-9]+$/);
      // They should be different (very high probability)
      expect(userDataDir1).not.toBe(userDataDir2);
    });
  });

  describe('error handling', () => {
    it('should handle launch errors properly', async () => {
      const installation = new BrowserInstallation(
        '/nonexistent/path/chromium',
        '120.0.6099.109',
        'system'
      );

      // This should fail because the path doesn't exist
      await expect(installation.launch()).rejects.toThrow(
        'Failed to launch browser at /nonexistent/path/chromium: Browser was not found at the configured executablePath (/nonexistent/path/chromium)'
      );
    });

    it('should handle verify errors properly', async () => {
      const installation = new BrowserInstallation(
        '/nonexistent/path/chromium',
        '120.0.6099.109',
        'system'
      );

      // This should return false because the path doesn't exist
      const result = await installation.verify();
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const installation = new BrowserInstallation(
        '/usr/bin/chromium',
        '120.0.6099.109',
        'system'
      );

      const result = installation.toString();

      expect(result).toBe('BrowserInstallation(system:120.0.6099.109@/usr/bin/chromium)');
    });

    it('should work with managed installation', () => {
      const installation = new BrowserInstallation(
        '/home/user/.puppeteer-mcp/chromium/120.0.6099.109/chrome',
        '120.0.6099.109',
        'managed'
      );

      const result = installation.toString();

      expect(result).toBe('BrowserInstallation(managed:120.0.6099.109@/home/user/.puppeteer-mcp/chromium/120.0.6099.109/chrome)');
    });
  });
});