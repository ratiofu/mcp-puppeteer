/**
 * Imperative shell for Chrome for Testing API operations
 * Contains all side effects (I/O operations)
 */

import { createWriteStream } from 'node:fs'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { ConcreteFileSystemOperations, type FileSystemOperations } from '../io/index.js'
import type { DownloadOptions, DownloadProgress, DownloadResult } from './types.js'

/**
 * Interface for Chrome for Testing operations with side effects
 */
export interface ChromeForTestingOperations {
  /**
   * Fetch versions from Chrome for Testing API
   */
  fetchVersions(): Promise<any>

  /**
   * Download a file from URL to local path
   */
  downloadFile(url: string, filePath: string, options: DownloadOptions): Promise<DownloadResult>

  /**
   * Ensure directory exists
   */
  ensureDirectory(path: string): Promise<void>
}

/**
 * Default implementation using real I/O operations
 */
export class DefaultChromeForTestingOperations implements ChromeForTestingOperations {
  private fs: FileSystemOperations

  constructor(fs?: FileSystemOperations) {
    this.fs = fs || new ConcreteFileSystemOperations()
  }
  private static readonly API_BASE_URL = 'https://googlechromelabs.github.io/chrome-for-testing'
  private static readonly VERSIONS_ENDPOINT = '/known-good-versions-with-downloads.json'

  async fetchVersions(): Promise<any> {
    const url = `${DefaultChromeForTestingOperations.API_BASE_URL}${DefaultChromeForTestingOperations.VERSIONS_ENDPOINT}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  async downloadFile(
    url: string,
    filePath: string,
    options: DownloadOptions,
  ): Promise<DownloadResult> {
    const timeout = options.timeout || 300_000 // 5 minutes default

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { signal: controller.signal })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? Number.parseInt(contentLength, 10) : 0

      let downloaded = 0
      const startTime = Date.now()

      // Ensure directory exists
      await this.fs.mkdir(dirname(filePath), { recursive: true })

      // Create write stream
      const writeStream = createWriteStream(filePath)

      // Track progress if we have content length and callback
      if (total > 0 && options.onProgress) {
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Response body is not readable')
        }

        try {
          // biome-ignore lint/nursery/noUnnecessaryConditions: legitimate pattern for reading streams until done
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            downloaded += value.length
            const elapsed = Date.now() - startTime
            const speed = elapsed > 0 ? (downloaded / elapsed) * 1000 : 0
            const percentage = (downloaded / total) * 100

            const progress: DownloadProgress = {
              total,
              downloaded,
              percentage,
              speed,
            }

            options.onProgress(progress)
            writeStream.write(value)
          }
        } finally {
          reader.releaseLock()
        }

        writeStream.end()
      } else {
        // Simple download without progress tracking
        if (!response.body) {
          throw new Error('Response body is empty')
        }
        await pipeline(response.body as any, writeStream)
        downloaded = total || 0
      }

      const finalProgress: DownloadProgress = {
        total: downloaded,
        downloaded,
        percentage: 100,
        speed: 0,
      }

      return {
        success: true,
        filePath,
        progress: finalProgress,
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async ensureDirectory(path: string): Promise<void> {
    await this.fs.mkdir(path, { recursive: true })
  }
}
