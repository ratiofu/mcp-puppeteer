import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChromeForTestingAPI } from '../ChromeForTestingAPI.js';
import { DownloadOptions } from '../types.js';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe.skip('ChromeForTestingAPI Integration Tests', () => {
    let api: ChromeForTestingAPI;
    let tempDir: string;

    beforeEach(async () => {
        api = new ChromeForTestingAPI();
        // Create a temporary directory for downloads
        tempDir = await mkdtemp(join(tmpdir(), 'chrome-for-testing-test-'));
    });

    afterEach(async () => {
        // Clean up temporary directory
        try {
            await rm(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    it('should fetch available versions from live API', async () => {
        const versions = await api.getAvailableVersions();

        expect(versions).toBeDefined();
        expect(Array.isArray(versions)).toBe(true);
        expect(versions.length).toBeGreaterThan(0);

        // Check structure of first version
        const firstVersion = versions[0];
        expect(firstVersion).toHaveProperty('kind', 'chromium');
        expect(firstVersion).toHaveProperty('version');
        expect(firstVersion).toHaveProperty('revision');
        expect(firstVersion).toHaveProperty('downloads');
        expect(typeof firstVersion.version).toBe('string');
        expect(typeof firstVersion.revision).toBe('string');

        // Version should be in semantic version format
        expect(firstVersion.version).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    }, 15_000); // 15 seconds

    it('should get latest version from live API', async () => {
        const latestVersion = await api.getLatestVersion();

        expect(latestVersion).toBeDefined();
        expect(latestVersion?.kind).toBe('chromium');
        expect(latestVersion?.version).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
        expect(latestVersion?.downloads).toBeDefined();
    }, 15_000); // 15 seconds

    it('should start download and stop after first few bytes', async () => {
        // Get all available versions
        const versions = await api.getAvailableVersions();
        expect(versions.length).toBeGreaterThan(0);

        // Find a version that has downloads for the current platform
        const { detectPlatform } = await import('../../browser-discovery/envUtils.js');
        const platformInfo = detectPlatform();

        const versionWithDownload = versions.find(version => {
            const chromeDownloads = version.downloads.chrome || [];
            return chromeDownloads.some(download => download.platform === platformInfo.platform);
        });

        if (!versionWithDownload) {
            console.log('No version found with download for current platform, skipping download test');
            return; // Skip this test if no suitable version found
        }

        let downloadStarted = false;
        let bytesReceived = 0;

        const options: DownloadOptions = {
            destinationDir: tempDir,
            timeout: 2_000, // 5 second timeout - short to stop download quickly
            onProgress: (progress) => {
                downloadStarted = true;
                bytesReceived = progress.downloaded;

                // Log progress for debugging
                console.log(`Download progress: ${progress.downloaded}/${progress.total} bytes (${progress.percentage.toFixed(1)}%)`);
            }
        };

        // Start download but expect it to timeout quickly due to short timeout
        const result = await api.downloadChromium(versionWithDownload, options);

        // The download should either succeed (if very fast) or fail due to timeout
        if (result.success) {
            expect(result.filePath).toBeDefined();
            expect(result.filePath).toContain(tempDir);
            console.log('Download completed successfully');
        } else {
            // If it failed, it should be due to timeout or network issues
            expect(result.error).toBeDefined();
            console.log('Download failed as expected:', result.error);

            // If download started but failed due to timeout, that's still a success for this test
            if (downloadStarted && bytesReceived > 0) {
                console.log('Download started successfully before timing out');
                return; // Test passed - download started
            }
        }

        // If we get here and download succeeded, verify the file path
        if (result.success) {
            expect(downloadStarted).toBe(true);
            expect(bytesReceived).toBeGreaterThan(0);
        }
    }, 15_000); // 15 second timeout

    it('should find specific version if it exists', async () => {
        // First get available versions
        const versions = await api.getAvailableVersions();
        expect(versions.length).toBeGreaterThan(0);

        // Try to find the first version
        const targetVersion = versions[0].version;
        const foundVersion = await api.findVersion(targetVersion);

        expect(foundVersion).toBeDefined();
        expect(foundVersion?.version).toBe(targetVersion);
        expect(foundVersion?.kind).toBe('chromium');
    }, 15_000); // 15 seconds

    it('should return null for non-existent version', async () => {
        const nonExistentVersion = '999.999.999.999';
        const foundVersion = await api.findVersion(nonExistentVersion);

        expect(foundVersion).toBeNull();
    }, 15_000); // 15 seconds
});