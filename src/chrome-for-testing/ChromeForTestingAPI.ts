import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { pipeline } from 'stream/promises';
import { detectPlatform } from '../browser-discovery/envUtils.js';
import { 
  BrowserVersion, 
  ChromeForTestingResponse, 
  DownloadOptions, 
  DownloadProgress, 
  DownloadResult
} from './types.js';

/**
 * Chrome for Testing API integration service
 * Provides access to available Chromium versions and download functionality
 */
export class ChromeForTestingAPI {
  private static readonly API_BASE_URL = 'https://googlechromelabs.github.io/chrome-for-testing';
  private static readonly VERSIONS_ENDPOINT = '/known-good-versions-with-downloads.json';

  /**
   * Fetch available browser versions from Chrome for Testing API
   * @returns Promise resolving to array of browser versions with kind='chromium'
   */
  async getAvailableVersions(): Promise<BrowserVersion[]> {
    try {
      const url = `${ChromeForTestingAPI.API_BASE_URL}${ChromeForTestingAPI.VERSIONS_ENDPOINT}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ChromeForTestingResponse = await response.json();
      
      // Transform API response to our BrowserVersion format
      return data.versions.map(version => ({
        kind: 'chromium' as const,
        version: version.version,
        revision: version.revision,
        downloads: version.downloads
      }));
    } catch (error) {
      throw new Error(`Failed to fetch available versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download Chromium for the specified version and platform
   * @param version Browser version to download
   * @param options Download options including destination and progress callback
   * @returns Promise resolving to download result
   */
  async downloadChromium(version: BrowserVersion, options: DownloadOptions): Promise<DownloadResult> {
    const platformInfo = detectPlatform();
    
    if (!platformInfo.supported) {
      return {
        success: false,
        error: `Platform ${platformInfo.name} is not supported for Chrome for Testing downloads`
      };
    }

    const chromeDownloads = version.downloads.chrome || [];
    const platformDownload = chromeDownloads.find(download => download.platform === platformInfo.platform);
    
    if (!platformDownload) {
      return {
        success: false,
        error: `No download URL available for ${platformInfo.name} (${platformInfo.platform})`
      };
    }
    
    const downloadUrl = platformDownload.url;

    try {
      // Ensure destination directory exists
      await mkdir(options.destinationDir, { recursive: true });
      
      // Generate filename from URL
      const filename = this.extractFilenameFromUrl(downloadUrl);
      const filePath = join(options.destinationDir, filename);

      // Start download with progress tracking
      const result = await this.downloadFile(downloadUrl, filePath, options);
      
      return {
        success: true,
        filePath,
        progress: result.progress
      };
    } catch (error) {
      return {
        success: false,
        error: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Download a file with progress tracking and error handling
   * @private
   */
  private async downloadFile(
    url: string, 
    filePath: string, 
    options: DownloadOptions
  ): Promise<{ progress: DownloadProgress }> {
    const timeout = options.timeout || 300000; // 5 minutes default
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      let downloaded = 0;
      const startTime = Date.now();

      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });
      
      // Create write stream
      const writeStream = createWriteStream(filePath);
      
      // Track progress if we have content length and callback
      if (total > 0 && options.onProgress) {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            downloaded += value.length;
            const elapsed = Date.now() - startTime;
            const speed = elapsed > 0 ? (downloaded / elapsed) * 1000 : 0;
            const percentage = (downloaded / total) * 100;

            const progress: DownloadProgress = {
              total,
              downloaded,
              percentage,
              speed
            };

            options.onProgress(progress);
            writeStream.write(value);
          }
        } finally {
          reader.releaseLock();
        }
        
        writeStream.end();
      } else {
        // Simple download without progress tracking
        if (!response.body) {
          throw new Error('Response body is empty');
        }
        await pipeline(response.body as any, writeStream);
        downloaded = total || 0;
      }

      const finalProgress: DownloadProgress = {
        total: downloaded,
        downloaded,
        percentage: 100,
        speed: 0
      };

      return { progress: finalProgress };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Extract filename from download URL
   * @private
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename || 'chromium-download.zip';
    } catch {
      return 'chromium-download.zip';
    }
  }

  /**
   * Get the latest available version
   * @returns Promise resolving to the latest browser version
   */
  async getLatestVersion(): Promise<BrowserVersion | null> {
    const versions = await this.getAvailableVersions();
    if (versions.length === 0) {
      return null;
    }

    // Sort versions by version string (assuming semantic versioning)
    const sortedVersions = versions.sort((a, b) => {
      const aVersion = a.version.split('.').map(Number);
      const bVersion = b.version.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
        const aPart = aVersion[i] || 0;
        const bPart = bVersion[i] || 0;
        
        if (aPart !== bPart) {
          return bPart - aPart; // Descending order
        }
      }
      
      return 0;
    });

    return sortedVersions[0];
  }

  /**
   * Find a specific version by version string
   * @param versionString Version to find (e.g., "120.0.6099.109")
   * @returns Promise resolving to the browser version or null if not found
   */
  async findVersion(versionString: string): Promise<BrowserVersion | null> {
    const versions = await this.getAvailableVersions();
    return versions.find(v => v.version === versionString) || null;
  }
}