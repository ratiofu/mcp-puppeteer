import { join } from 'path';
import { detectPlatform } from '../browser-discovery/envUtils.js';
import type { 
  BrowserVersion, 
  DownloadOptions, 
  DownloadResult
} from './types.js';
import { 
  compareVersions,
  extractFilenameFromUrl,
  findPlatformDownload,
  findLatestVersion,
  findVersionByString,
  transformApiResponse
} from './core.js';
import { DefaultChromeForTestingOperations, type ChromeForTestingOperations } from './operations.js';

/**
 * Chrome for Testing API integration service
 * Provides access to available Chromium versions and download functionality
 */
export class ChromeForTestingAPI {
  private operations: ChromeForTestingOperations;

  constructor(operations?: ChromeForTestingOperations) {
    this.operations = operations || new DefaultChromeForTestingOperations();
  }

  /**
   * Fetch available browser versions from Chrome for Testing API
   * @returns Promise resolving to array of browser versions with kind='chromium'
   */
  async getAvailableVersions(): Promise<BrowserVersion[]> {
    try {
      const data = await this.operations.fetchVersions();
      return transformApiResponse(data);
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
    const platformDownload = findPlatformDownload(chromeDownloads, platformInfo.platform);
    
    if (!platformDownload) {
      return {
        success: false,
        error: `No download URL available for ${platformInfo.name} (${platformInfo.platform})`
      };
    }
    
    const downloadUrl = platformDownload.url;

    try {
      // Generate filename from URL
      const filename = extractFilenameFromUrl(downloadUrl);
      const filePath = join(options.destinationDir, filename);

      // Start download with progress tracking
      const result = await this.operations.downloadFile(downloadUrl, filePath, options);
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }



  /**
   * Get the latest available version
   * @returns Promise resolving to the latest browser version
   */
  async getLatestVersion(): Promise<BrowserVersion | null> {
    const versions = await this.getAvailableVersions();
    return findLatestVersion(versions);
  }

  /**
   * Find a specific version by version string
   * @param versionString Version to find (e.g., "120.0.6099.109")
   * @returns Promise resolving to the browser version or null if not found
   */
  async findVersion(versionString: string): Promise<BrowserVersion | null> {
    const versions = await this.getAvailableVersions();
    return findVersionByString(versions, versionString);
  }
}