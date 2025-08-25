import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, rm, writeFile, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { BrowserManagerService, type ChromeForTestingAPIInterface, type BrowserInstallationFactory } from '../BrowserManagerService.js';
import type { FileSystemOperations, ProcessOperations } from '../../io/index.js';
import { BrowserInstallation } from '../BrowserInstallation.js';
import type { BrowserVersion } from '../../chrome-for-testing/types.js';

describe('BrowserManagerService', () => {
  let service: BrowserManagerService;
  let tempDir: string;
  let mockChromeForTestingAPI: ChromeForTestingAPIInterface;
  let mockFileSystem: FileSystemOperations;
  let mockProcess: ProcessOperations;
  let mockBrowserFactory: BrowserInstallationFactory;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = join(tmpdir(), `browser-manager-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);
    await mkdir(tempDir, { recursive: true });

    const managedInstallPath = join(tempDir, '.puppeteer-mcp', 'chromium');

    // Create mock dependencies
    mockChromeForTestingAPI = {
      findVersion: vi.fn(),
      getLatestVersion: vi.fn(),
      downloadChromium: vi.fn()
    };

    mockFileSystem = {
      mkdir: vi.fn().mockImplementation(async (path: string, options?: any) => {
        await mkdir(path, options);
      }),
      readdir: vi.fn().mockImplementation(async (path: string, options?: any) => {
        const fs = await import('fs/promises');
        return await fs.readdir(path, options);
      }),
      rm: vi.fn().mockImplementation(async (path: string, options?: any) => {
        await rm(path, options);
      }),
      stat: vi.fn().mockImplementation(async (path: string) => {
        const fs = await import('fs/promises');
        return await fs.stat(path);
      }),
      existsSync: vi.fn().mockImplementation((path: string) => existsSync(path)),
      writeFile: vi.fn().mockImplementation(async (path: string, content: string) => {
        await writeFile(path, content);
      }),
      chmod: vi.fn().mockImplementation(async (path: string, mode: number) => {
        await chmod(path, mode);
      }),
      readFile: vi.fn().mockImplementation(async (path: string, encoding?: string) => {
        const fs = await import('fs/promises');
        return await fs.readFile(path, encoding as any);
      })
    };

    mockProcess = {
      execSync: vi.fn().mockReturnValue('Chromium 120.0.6099.109'),
      getEnv: vi.fn().mockImplementation((key: string) => process.env[key])
    };

    mockBrowserFactory = {
      create: vi.fn().mockImplementation((path: string, version: string, source: 'system' | 'managed', verified: boolean = false) => {
        const installation = new BrowserInstallation(path, version, source, verified);
        // Mock the verify method to return true by default
        vi.spyOn(installation, 'verify').mockResolvedValue(true);
        return installation;
      })
    };

    // Create service instance with injected dependencies
    service = new BrowserManagerService(
      managedInstallPath,
      mockChromeForTestingAPI,
      mockFileSystem,
      mockProcess,
      mockBrowserFactory
    );
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }

    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('installChromium', () => {
    const mockVersion: BrowserVersion = {
      kind: 'chromium',
      version: '120.0.6099.109',
      revision: '1234567',
      downloads: {
        chrome: [{
          platform: 'linux64',
          url: 'https://example.com/chrome-linux64.zip'
        }]
      }
    };

    it('should install latest version when no version specified', async () => {
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109');
      const downloadPath = join(versionDir, 'chrome-linux64.zip');
      const executablePath = join(versionDir, 'chrome');

      // Setup mocks
      (mockChromeForTestingAPI.getLatestVersion as any).mockResolvedValue(mockVersion);
      (mockChromeForTestingAPI.downloadChromium as any).mockResolvedValue({
        success: true,
        filePath: downloadPath
      });

      // Mock extraction and executable finding
      const originalExtractArchive = (service as any).extractArchive;
      const originalFindExecutable = (service as any).findExecutableInExtraction;
      
      (service as any).extractArchive = vi.fn().mockResolvedValue(versionDir);
      (service as any).findExecutableInExtraction = vi.fn().mockResolvedValue(executablePath);

      const result = await service.installChromium();

      expect(result.success).toBe(true);
      expect(result.version).toBe('120.0.6099.109');
      expect(result.path).toBe(executablePath);
      expect(mockChromeForTestingAPI.getLatestVersion).toHaveBeenCalled();
      expect(mockChromeForTestingAPI.downloadChromium).toHaveBeenCalledWith(
        mockVersion,
        expect.objectContaining({
          destinationDir: versionDir,
          timeout: 600000
        })
      );

      // Restore original methods
      (service as any).extractArchive = originalExtractArchive;
      (service as any).findExecutableInExtraction = originalFindExecutable;
    });

    it('should install specific version when requested', async () => {
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109');
      const downloadPath = join(versionDir, 'chrome-linux64.zip');
      const executablePath = join(versionDir, 'chrome');

      // Setup mocks
      (mockChromeForTestingAPI.findVersion as any).mockResolvedValue(mockVersion);
      (mockChromeForTestingAPI.downloadChromium as any).mockResolvedValue({
        success: true,
        filePath: downloadPath
      });

      // Mock extraction and executable finding
      const originalExtractArchive = (service as any).extractArchive;
      const originalFindExecutable = (service as any).findExecutableInExtraction;
      
      (service as any).extractArchive = vi.fn().mockResolvedValue(versionDir);
      (service as any).findExecutableInExtraction = vi.fn().mockResolvedValue(executablePath);

      const result = await service.installChromium({ version: '120.0.6099.109' });

      expect(result.success).toBe(true);
      expect(result.version).toBe('120.0.6099.109');
      expect(mockChromeForTestingAPI.findVersion).toHaveBeenCalledWith('120.0.6099.109');

      // Restore original methods
      (service as any).extractArchive = originalExtractArchive;
      (service as any).findExecutableInExtraction = originalFindExecutable;
    });

    it('should return error when version not found', async () => {
      (mockChromeForTestingAPI.findVersion as any).mockResolvedValue(null);

      const result = await service.installChromium({ version: '999.0.0.0' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Version 999.0.0.0 not found');
    });

    it('should return error when no versions available', async () => {
      (mockChromeForTestingAPI.getLatestVersion as any).mockResolvedValue(null);

      const result = await service.installChromium();

      expect(result.success).toBe(false);
      expect(result.error).toContain('No versions available');
    });

    it('should return error when download fails', async () => {
      (mockChromeForTestingAPI.getLatestVersion as any).mockResolvedValue(mockVersion);
      (mockChromeForTestingAPI.downloadChromium as any).mockResolvedValue({
        success: false,
        error: 'Network error'
      });

      const result = await service.installChromium();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should return existing installation if already installed and verified', async () => {
      // Create existing installation
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109');
      await mkdir(versionDir, { recursive: true });
      const executablePath = join(versionDir, 'chrome');
      await writeFile(executablePath, '#!/bin/bash\necho "mock chrome"');
      await chmod(executablePath, 0o755);

      (mockChromeForTestingAPI.findVersion as any).mockResolvedValue(mockVersion);

      const result = await service.installChromium({ version: '120.0.6099.109' });

      expect(result.success).toBe(true);
      expect(result.version).toBe('120.0.6099.109');
      expect(result.path).toBe(executablePath);
      expect(mockChromeForTestingAPI.downloadChromium).not.toHaveBeenCalled();
    });

    it('should reinstall if existing installation fails verification', async () => {
      // Create existing installation
      const versionDir = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109');
      await mkdir(versionDir, { recursive: true });
      const executablePath = join(versionDir, 'chrome');
      await writeFile(executablePath, '#!/bin/bash\necho "mock chrome"');
      await chmod(executablePath, 0o755);

      (mockChromeForTestingAPI.findVersion as any).mockResolvedValue(mockVersion);
      
      const downloadPath = join(versionDir, 'chrome-linux64.zip');
      
      (mockChromeForTestingAPI.downloadChromium as any).mockResolvedValue({
        success: true,
        filePath: downloadPath
      });

      // Mock the browser factory to return installations with different verification results
      let verifyCallCount = 0;
      (mockBrowserFactory.create as any).mockImplementation((path: string, version: string, source: 'system' | 'managed', verified: boolean = false) => {
        const installation = new BrowserInstallation(path, version, source, verified);
        vi.spyOn(installation, 'verify').mockImplementation(async () => {
          verifyCallCount++;
          return verifyCallCount > 1; // First call fails, second succeeds
        });
        return installation;
      });

      // Mock extraction and executable finding
      const originalExtractArchive = (service as any).extractArchive;
      const originalFindExecutable = (service as any).findExecutableInExtraction;
      
      (service as any).extractArchive = vi.fn().mockResolvedValue(versionDir);
      (service as any).findExecutableInExtraction = vi.fn().mockResolvedValue(executablePath);

      const result = await service.installChromium({ version: '120.0.6099.109' });

      expect(result.success).toBe(true);
      expect(mockChromeForTestingAPI.downloadChromium).toHaveBeenCalled();

      // Restore original methods
      (service as any).extractArchive = originalExtractArchive;
      (service as any).findExecutableInExtraction = originalFindExecutable;
    });

    it('should handle extraction errors', async () => {
      const downloadPath = join(tempDir, 'chrome-linux64.zip');

      (mockChromeForTestingAPI.getLatestVersion as any).mockResolvedValue(mockVersion);
      (mockChromeForTestingAPI.downloadChromium as any).mockResolvedValue({
        success: true,
        filePath: downloadPath
      });

      // Mock extraction to throw error
      const originalExtractArchive = (service as any).extractArchive;
      (service as any).extractArchive = vi.fn().mockRejectedValue(new Error('Extraction failed'));

      const result = await service.installChromium();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Installation failed');

      // Restore original method
      (service as any).extractArchive = originalExtractArchive;
    });
  });

  describe('cleanupOldVersions', () => {
    beforeEach(async () => {
      // Create multiple version directories
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium');
      await mkdir(chromiumDir, { recursive: true });

      const versions = ['118.0.5993.70', '119.0.6045.105', '120.0.6099.109', '121.0.6167.85'];
      for (const version of versions) {
        const versionDir = join(chromiumDir, version);
        await mkdir(versionDir, { recursive: true });
        await writeFile(join(versionDir, 'chrome'), 'mock executable');
      }
    });

    it('should keep specified number of recent versions', async () => {
      const result = await service.cleanupOldVersions(2);

      expect(result.removedVersions).toHaveLength(2);
      expect(result.removedVersions).toContain('118.0.5993.70');
      expect(result.removedVersions).toContain('119.0.6045.105');

      // Check that newer versions still exist
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium');
      expect(existsSync(join(chromiumDir, '120.0.6099.109'))).toBe(true);
      expect(existsSync(join(chromiumDir, '121.0.6167.85'))).toBe(true);
    });

    it('should not remove versions when count is below threshold', async () => {
      const result = await service.cleanupOldVersions(5);

      expect(result.removedVersions).toHaveLength(0);
    });

    it('should handle non-existent directory gracefully', async () => {
      // Remove the chromium directory
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium');
      await rm(chromiumDir, { recursive: true, force: true });

      const result = await service.cleanupOldVersions();

      expect(result.removedVersions).toHaveLength(0);
    });

    it('should ignore non-version directories', async () => {
      // Create non-version directory
      const chromiumDir = join(tempDir, '.puppeteer-mcp', 'chromium');
      await mkdir(join(chromiumDir, 'not-a-version'), { recursive: true });

      const result = await service.cleanupOldVersions(2);

      // Should still remove 2 oldest versions, ignoring the non-version directory
      expect(result.removedVersions).toHaveLength(2);
    });
  });

  describe('createInstallation', () => {
    it('should create installation from managed path', async () => {
      const executablePath = join(tempDir, '.puppeteer-mcp', 'chromium', '120.0.6099.109', 'chrome');
      
      const installation = await service.createInstallation(executablePath);

      expect(installation.path).toBe(executablePath);
      expect(installation.version).toBe('120.0.6099.109');
      expect(installation.source).toBe('managed');
    });

    it('should create installation from system path', async () => {
      const executablePath = '/usr/bin/chromium';
      
      // Mock process execSync to return version
      (mockProcess.execSync as any).mockReturnValue('Chromium 119.0.6045.105');

      const installation = await service.createInstallation(executablePath);

      expect(installation.path).toBe(executablePath);
      expect(installation.version).toBe('119.0.6045.105');
      expect(installation.source).toBe('system');
    });

    it('should handle version detection failure', async () => {
      const executablePath = '/usr/bin/chromium';
      
      // Mock process execSync to throw error
      (mockProcess.execSync as any).mockImplementation(() => {
        throw new Error('Command failed');
      });

      const installation = await service.createInstallation(executablePath);

      expect(installation.path).toBe(executablePath);
      expect(installation.version).toBe('unknown');
      expect(installation.source).toBe('system');
    });
  });

  describe('private methods', () => {
    it('should compare versions correctly', async () => {
      const service = new BrowserManagerService();
      const compareVersions = (service as any).compareVersions.bind(service);

      expect(compareVersions('120.0.6099.109', '119.0.6045.105')).toBeGreaterThan(0);
      expect(compareVersions('119.0.6045.105', '120.0.6099.109')).toBeLessThan(0);
      expect(compareVersions('120.0.6099.109', '120.0.6099.109')).toBe(0);
      expect(compareVersions('120.0.6099.109', '120.0.6099.110')).toBeLessThan(0);
    });

    it('should find executable in directory', async () => {
      const testDir = join(tempDir, 'test-browser');
      await mkdir(testDir, { recursive: true });
      
      const executablePath = join(testDir, 'chrome');
      await writeFile(executablePath, 'mock executable');
      await chmod(executablePath, 0o755);

      const service = new BrowserManagerService();
      const findExecutable = (service as any).findExecutableInDirectory.bind(service);
      
      const found = await findExecutable(testDir);
      expect(found).toBe(executablePath);
    });

    it('should find executable recursively', async () => {
      const testDir = join(tempDir, 'test-browser');
      const subDir = join(testDir, 'bin');
      await mkdir(subDir, { recursive: true });
      
      const executablePath = join(subDir, 'chrome');
      await writeFile(executablePath, 'mock executable');
      await chmod(executablePath, 0o755);

      const service = new BrowserManagerService();
      const findExecutableRecursively = (service as any).findExecutableRecursively.bind(service);
      
      const found = await findExecutableRecursively(testDir, ['chrome']);
      expect(found).toBe(executablePath);
    });
  });
});