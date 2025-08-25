/**
 * Platform identifiers for Chrome for Testing API
 */
export type Platform = 'linux64' | 'mac-x64' | 'mac-arm64' | 'win32' | 'win64';

/**
 * Platform detection result
 */
export interface PlatformInfo {
  /** Detected platform identifier */
  platform: Platform;
  /** Human-readable platform name */
  name: string;
  /** Whether this platform is supported */
  supported: boolean;
}

/**
 * Check if an environment variable is "truthy" (starts with '1', 't', or 'T')
 * @param value Environment variable value
 * @returns True if the value is truthy
 */
export function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const firstChar = value.charAt(0).toLowerCase();
  return firstChar === '1' || firstChar === 't';
}

/**
 * Detect the current platform for Chrome for Testing downloads
 * @returns Platform information including identifier and support status
 */
export function detectPlatform(): PlatformInfo {
  const platform = process.platform;
  const arch = process.arch;

  switch (platform) {
    case 'darwin':
      if (arch === 'arm64') {
        return {
          platform: 'mac-arm64',
          name: 'macOS (Apple Silicon)',
          supported: true
        };
      } else {
        return {
          platform: 'mac-x64',
          name: 'macOS (Intel)',
          supported: true
        };
      }
    
    case 'linux':
      if (arch === 'x64') {
        return {
          platform: 'linux64',
          name: 'Linux (x64)',
          supported: true
        };
      } else {
        return {
          platform: 'linux64', // Fallback to linux64
          name: `Linux (${arch})`,
          supported: false
        };
      }
    
    case 'win32':
      if (arch === 'x64') {
        return {
          platform: 'win64',
          name: 'Windows (x64)',
          supported: true
        };
      } else {
        return {
          platform: 'win32',
          name: 'Windows (x86)',
          supported: true
        };
      }
    
    default:
      return {
        platform: 'linux64', // Fallback
        name: `${platform} (${arch})`,
        supported: false
      };
  }
}