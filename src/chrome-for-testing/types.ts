/**
 * Types for Chrome for Testing API integration
 */

/**
 * Platform download entry from Chrome for Testing API
 */
export interface PlatformDownload {
  /** Platform identifier */
  platform: string;
  /** Download URL */
  url: string;
}

/**
 * Browser version information from Chrome for Testing API
 */
export interface BrowserVersion {
  /** Browser type - currently only 'chromium' is supported */
  kind: 'chromium';
  /** Version string (e.g., "120.0.6099.109") */
  version: string;
  /** Revision number */
  revision: string;
  /** Download URLs for different platforms */
  downloads: {
    chrome?: PlatformDownload[];
    chromedriver?: PlatformDownload[];
    'chrome-headless-shell'?: PlatformDownload[];
  };
}

/**
 * Download progress information
 */
export interface DownloadProgress {
  /** Total bytes to download */
  total: number;
  /** Bytes downloaded so far */
  downloaded: number;
  /** Download percentage (0-100) */
  percentage: number;
  /** Download speed in bytes per second */
  speed: number;
}

/**
 * Download result
 */
export interface DownloadResult {
  /** Whether download was successful */
  success: boolean;
  /** Path to downloaded file if successful */
  filePath?: string;
  /** Error message if download failed */
  error?: string;
  /** Final download progress */
  progress?: DownloadProgress;
}

/**
 * Chrome for Testing API response structure
 */
export interface ChromeForTestingResponse {
  /** Timestamp of the API response */
  timestamp: string;
  /** Available browser versions */
  versions: BrowserVersion[];
}

/**
 * Download options
 */
export interface DownloadOptions {
  /** Destination directory for download */
  destinationDir: string;
  /** Optional progress callback */
  onProgress?: (progress: DownloadProgress) => void;
  /** Timeout in milliseconds (default: 300000 = 5 minutes) */
  timeout?: number;
}