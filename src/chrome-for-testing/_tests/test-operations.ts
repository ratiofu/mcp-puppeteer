/**
 * Test implementation of ChromeForTestingOperations
 * Simple test doubles that avoid complex mocking
 */

import type { ChromeForTestingOperations } from '../operations.js'
import type { DownloadOptions, DownloadResult } from '../types.js'

export class TestChromeForTestingOperations implements ChromeForTestingOperations {
  private versionsResponse: any = {
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
            { platform: 'mac-arm64', url: 'https://example.com/chrome-mac-arm64.zip' },
          ],
        },
      },
      {
        kind: 'chromium',
        version: '121.0.6167.85',
        revision: '1234568',
        downloads: {
          chrome: [
            { platform: 'linux64', url: 'https://example.com/chrome-linux64-121.zip' },
            { platform: 'mac-x64', url: 'https://example.com/chrome-mac-x64-121.zip' },
          ],
        },
      },
    ],
  }

  private shouldFailFetch = false
  private shouldFailDownload = false
  private downloadResult: DownloadResult = {
    success: true,
    filePath: '',
    progress: {
      total: 1000,
      downloaded: 1000,
      percentage: 100,
      speed: 0,
    },
  }

  // Test configuration methods
  setVersionsResponse(response: any): void {
    this.versionsResponse = response
  }

  setShouldFailFetch(fail: boolean): void {
    this.shouldFailFetch = fail
  }

  setShouldFailDownload(fail: boolean): void {
    this.shouldFailDownload = fail
  }

  setDownloadResult(result: DownloadResult): void {
    this.downloadResult = result
  }

  // Implementation
  async fetchVersions(): Promise<any> {
    if (this.shouldFailFetch) {
      throw new Error('Test fetch failure')
    }
    return this.versionsResponse
  }

  async downloadFile(
    _url: string,
    filePath: string,
    options: DownloadOptions,
  ): Promise<DownloadResult> {
    if (this.shouldFailDownload) {
      return {
        success: false,
        error: 'Test download failure',
      }
    }

    // Simulate progress callback if provided
    if (options.onProgress && this.downloadResult.progress) {
      options.onProgress({
        total: 1000,
        downloaded: 500,
        percentage: 50,
        speed: 1000,
      })
      options.onProgress(this.downloadResult.progress)
    }

    return {
      ...this.downloadResult,
      filePath,
    }
  }

  async ensureDirectory(_path: string): Promise<void> {
    // No-op for tests
  }
}
