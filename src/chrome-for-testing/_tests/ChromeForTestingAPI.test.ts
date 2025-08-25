import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { ChromeForTestingAPI } from '../ChromeForTestingAPI.js';
import { BrowserVersion, ChromeForTestingResponse, DownloadOptions } from '../types.js';
import * as envUtils from '../../browser-discovery/envUtils.js';

// Mock Node.js modules
vi.mock('fs', () => ({
  createWriteStream: vi.fn()
}));

vi.mock('fs/promises', () => ({
  mkdir: vi.fn()
}));

vi.mock('stream/promises', () => ({
  pipeline: vi.fn()
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ChromeForTestingAPI', () => {
  let api: ChromeForTestingAPI;
  let mockWriteStream: any;

  beforeEach(() => {
    api = new ChromeForTestingAPI();
    mockWriteStream = {
      write: vi.fn(),
      end: vi.fn()
    };
    vi.mocked(createWriteStream).mockReturnValue(mockWriteStream);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(pipeline).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableVersions', () => {
    it('should fetch and transform available versions successfully', async () => {
      const mockApiResponse: ChromeForTestingResponse = {
        timestamp: '2024-01-01T00:00:00.000Z',
        versions: [
          {
            kind: 'chromium',
            version: '120.0.6099.109',
            revision: '1234567',
            downloads: {
              chrome: [
                { platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' },
                { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64.zip' },
                { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' }
              ]
            }
          },
          {
            kind: 'chromium',
            version: '121.0.6167.85',
            revision: '1234568',
            downloads: {
              chrome: [
                { platform: 'linux64', url: 'https://example.com/chrome-linux64-121.zip' },
                { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64-121.zip' }
              ]
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const versions = await api.getAvailableVersions();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json'
      );
      expect(versions).toHaveLength(2);
      expect(versions[0]).toEqual({
        kind: 'chromium',
        version: '120.0.6099.109',
        revision: '1234567',
        downloads: {
          chrome: [
            { platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' },
            { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64.zip' },
            { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' }
          ]
        }
      });
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(api.getAvailableVersions()).rejects.toThrow(
        'Failed to fetch available versions: HTTP 404: Not Found'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getAvailableVersions()).rejects.toThrow(
        'Failed to fetch available versions: Network error'
      );
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(api.getAvailableVersions()).rejects.toThrow(
        'Failed to fetch available versions: Invalid JSON'
      );
    });
  });

  describe('platform detection integration', () => {
    it('should use envUtils.detectPlatform for platform detection', () => {
      const mockPlatformInfo = {
        platform: 'mac-arm64' as const,
        name: 'macOS (Apple Silicon)',
        supported: true
      };
      
      const detectPlatformSpy = vi.spyOn(envUtils, 'detectPlatform').mockReturnValue(mockPlatformInfo);
      
      // This will be tested indirectly through downloadChromium
      const mockVersion: BrowserVersion = {
        kind: 'chromium',
        version: '120.0.6099.109',
        revision: '1234567',
        downloads: {
          chrome: [
            { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' }
          ]
        }
      };

      const options: DownloadOptions = {
        destinationDir: '/tmp/test'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
        body: { pipe: vi.fn() }
      });

      // Call downloadChromium which internally uses detectPlatform
      api.downloadChromium(mockVersion, options);

      expect(detectPlatformSpy).toHaveBeenCalled();
      
      detectPlatformSpy.mockRestore();
    });
  });

  describe('downloadChromium', () => {
    const mockVersion: BrowserVersion = {
      kind: 'chromium',
      version: '120.0.6099.109',
      revision: '1234567',
      downloads: {
        chrome: [
          { platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' },
          { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64.zip' },
          { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' }
        ]
      }
    };

    beforeEach(() => {
      // Mock platform detection to return supported platform
      vi.spyOn(envUtils, 'detectPlatform').mockReturnValue({
        platform: 'mac-arm64',
        name: 'macOS (Apple Silicon)',
        supported: true
      });
    });

    it('should download successfully with progress tracking', async () => {
      const mockProgressCallback = vi.fn();
      const options: DownloadOptions = {
        destinationDir: '/tmp/test',
        onProgress: mockProgressCallback
      };

      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new Uint8Array(1000) })
          .mockResolvedValueOnce({ done: false, value: new Uint8Array(1000) })
          .mockResolvedValueOnce({ done: true }),
        releaseLock: vi.fn()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-length' ? '2000' : null
        },
        body: {
          getReader: () => mockReader
        }
      });

      const result = await api.downloadChromium(mockVersion, options);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/tmp/test/chrome-mac-arm64.zip');
      expect(mockProgressCallback).toHaveBeenCalledTimes(2);
      expect(mockProgressCallback).toHaveBeenCalledWith({
        total: 2000,
        downloaded: 1000,
        percentage: 50,
        speed: expect.any(Number)
      });
      expect(vi.mocked(mkdir)).toHaveBeenCalledWith('/tmp/test', { recursive: true });
    });

    it('should download successfully without progress tracking', async () => {
      const options: DownloadOptions = {
        destinationDir: '/tmp/test'
      };

      const mockBody = { pipe: vi.fn() };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null
        },
        body: mockBody
      });

      const result = await api.downloadChromium(mockVersion, options);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/tmp/test/chrome-mac-arm64.zip');
      expect(vi.mocked(pipeline)).toHaveBeenCalledWith(mockBody, mockWriteStream);
    });

    it('should handle unsupported platform', async () => {
      vi.spyOn(envUtils, 'detectPlatform').mockReturnValue({
        platform: 'linux64',
        name: 'freebsd (x64)',
        supported: false
      });
      
      const options: DownloadOptions = {
        destinationDir: '/tmp/test'
      };

      const result = await api.downloadChromium(mockVersion, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Platform freebsd (x64) is not supported');
    });

    it('should handle missing download URL for platform', async () => {
      const versionWithoutMacArm: BrowserVersion = {
        ...mockVersion,
        downloads: {
          chrome: [
            { platform: 'linux64', url: 'https://example.com/chrome-linux64.zip' }
          ]
        }
      };

      const options: DownloadOptions = {
        destinationDir: '/tmp/test'
      };

      const result = await api.downloadChromium(versionWithoutMacArm, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No download URL available for macOS (Apple Silicon)');
    });

    it('should handle HTTP errors during download', async () => {
      const options: DownloadOptions = {
        destinationDir: '/tmp/test'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await api.downloadChromium(mockVersion, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Download failed: HTTP 404: Not Found');
    });

    it('should handle network errors during download', async () => {
      const options: DownloadOptions = {
        destinationDir: '/tmp/test'
      };

      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await api.downloadChromium(mockVersion, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Download failed: Network timeout');
    });

    it('should handle timeout during download', async () => {
      const options: DownloadOptions = {
        destinationDir: '/tmp/test',
        timeout: 10 // Very short timeout
      };

      // Mock a slow response that will be aborted
      mockFetch.mockImplementationOnce((_url, options) => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => null },
              body: { pipe: vi.fn() }
            });
          }, 100);
          
          // Simulate abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('The operation was aborted'));
            });
          }
        });
      });

      const result = await api.downloadChromium(mockVersion, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Download failed');
    });
  });

  describe('getLatestVersion', () => {
    it('should return the latest version', async () => {
      const mockVersions: BrowserVersion[] = [
        {
          kind: 'chromium',
          version: '120.0.6099.109',
          revision: '1234567',
          downloads: { chrome: [] }
        },
        {
          kind: 'chromium',
          version: '121.0.6167.85',
          revision: '1234568',
          downloads: { chrome: [] }
        },
        {
          kind: 'chromium',
          version: '119.0.6045.105',
          revision: '1234566',
          downloads: { chrome: [] }
        }
      ];

      vi.spyOn(api, 'getAvailableVersions').mockResolvedValueOnce(mockVersions);

      const latest = await api.getLatestVersion();

      expect(latest?.version).toBe('121.0.6167.85'); // 121.0.6167.85 should be latest
    });

    it('should return null when no versions available', async () => {
      vi.spyOn(api, 'getAvailableVersions').mockResolvedValueOnce([]);

      const latest = await api.getLatestVersion();

      expect(latest).toBeNull();
    });

    it('should handle version sorting correctly', async () => {
      const mockVersions: BrowserVersion[] = [
        {
          kind: 'chromium',
          version: '120.0.6099.109',
          revision: '1234567',
          downloads: { chrome: [] }
        },
        {
          kind: 'chromium',
          version: '120.0.6099.110',
          revision: '1234568',
          downloads: { chrome: [] }
        },
        {
          kind: 'chromium',
          version: '120.0.6100.1',
          revision: '1234569',
          downloads: { chrome: [] }
        }
      ];

      vi.spyOn(api, 'getAvailableVersions').mockResolvedValueOnce(mockVersions);

      const latest = await api.getLatestVersion();

      expect(latest?.version).toBe('120.0.6100.1'); // Highest version
    });
  });

  describe('findVersion', () => {
    it('should find existing version', async () => {
      const mockVersions: BrowserVersion[] = [
        {
          kind: 'chromium',
          version: '120.0.6099.109',
          revision: '1234567',
          downloads: { chrome: [] }
        },
        {
          kind: 'chromium',
          version: '121.0.6167.85',
          revision: '1234568',
          downloads: { chrome: [] }
        }
      ];

      vi.spyOn(api, 'getAvailableVersions').mockResolvedValueOnce(mockVersions);

      const found = await api.findVersion('120.0.6099.109');

      expect(found).toEqual(mockVersions[0]);
    });

    it('should return null for non-existing version', async () => {
      const mockVersions: BrowserVersion[] = [
        {
          kind: 'chromium',
          version: '120.0.6099.109',
          revision: '1234567',
          downloads: { chrome: [] }
        }
      ];

      vi.spyOn(api, 'getAvailableVersions').mockResolvedValueOnce(mockVersions);

      const found = await api.findVersion('999.0.0.0');

      expect(found).toBeNull();
    });
  });

  describe('extractFilenameFromUrl', () => {
    it('should extract filename from valid URL', () => {
      const api = new ChromeForTestingAPI();
      // Access private method for testing
      const extractFilename = (api as any).extractFilenameFromUrl.bind(api);
      
      const filename = extractFilename('https://example.com/path/chrome-mac-arm64.zip');
      expect(filename).toBe('chrome-mac-arm64.zip');
    });

    it('should return default filename for invalid URL', () => {
      const api = new ChromeForTestingAPI();
      const extractFilename = (api as any).extractFilenameFromUrl.bind(api);
      
      const filename = extractFilename('invalid-url');
      expect(filename).toBe('chromium-download.zip');
    });

    it('should return default filename for URL without filename', () => {
      const api = new ChromeForTestingAPI();
      const extractFilename = (api as any).extractFilenameFromUrl.bind(api);
      
      const filename = extractFilename('https://example.com/path/');
      expect(filename).toBe('chromium-download.zip');
    });
  });
});