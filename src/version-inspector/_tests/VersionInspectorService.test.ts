import { beforeEach, describe, expect, it } from 'vitest'
import { type DeepMockProxy, mockDeep } from 'vitest-mock-extended'
import type { FileSystemOperations } from '../../io/FileSystemOperations.js'
import { VERSION_ERROR_TYPES } from '../types.js'
import { VersionInspectorService } from '../VersionInspectorService.js'

describe('VersionInspectorService', () => {
  let service: VersionInspectorService
  let mockFileSystem: DeepMockProxy<FileSystemOperations>

  beforeEach(() => {
    mockFileSystem = mockDeep<FileSystemOperations>()
    service = new VersionInspectorService(mockFileSystem)
  })

  describe('getVersionRequirement', () => {
    it('should return version from chromium.version file', async () => {
      const version = '120.0.6099.109'
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue(version)

      const result = await service.getVersionRequirement()

      expect(result).toBe(version)
      expect(mockFileSystem.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('chromium.version'),
      )
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(
        expect.stringContaining('chromium.version'),
        'utf8',
      )
    })

    it('should return version from custom project path', async () => {
      const version = '121.0.6167.85'
      const customPath = '/custom/project'
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue(version)

      const result = await service.getVersionRequirement(customPath)

      expect(result).toBe(version)
      expect(mockFileSystem.existsSync).toHaveBeenCalledWith(
        expect.stringContaining('/custom/project/chromium.version'),
      )
    })

    it('should return null when chromium.version file does not exist', async () => {
      mockFileSystem.existsSync.mockReturnValue(false)

      const result = await service.getVersionRequirement()

      expect(result).toBeNull()
      expect(mockFileSystem.readFile).not.toHaveBeenCalled()
    })

    it('should return null when chromium.version file is empty', async () => {
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue('   \n  ')

      const result = await service.getVersionRequirement()

      expect(result).toBeNull()
    })

    it('should throw FILE_READ_ERROR when file read fails', async () => {
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockRejectedValue(new Error('Permission denied'))

      await expect(service.getVersionRequirement()).rejects.toMatchObject({
        type: VERSION_ERROR_TYPES.fileReadError,
        message: expect.stringContaining('Failed to read chromium.version file'),
      })
    })
  })

  describe('getBundledVersion', () => {
    it('should return bundled version from package.json bundledChromiumVersion', async () => {
      const version = '120.0.6099.109'
      const packageJson = {
        name: 'test-package',
        bundledChromiumVersion: version,
      }
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(packageJson))

      const result = await service.getBundledVersion()

      expect(result).toBe(version)
    })

    it('should return bundled version from package.json chromiumVersion', async () => {
      const version = '121.0.6167.85'
      const packageJson = {
        name: 'test-package',
        chromiumVersion: version,
      }
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(packageJson))

      const result = await service.getBundledVersion()

      expect(result).toBe(version)
    })

    it('should return bundled version from package.json config.chromiumVersion', async () => {
      const version = '122.0.6261.94'
      const packageJson = {
        name: 'test-package',
        config: {
          chromiumVersion: version,
        },
      }
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(packageJson))

      const result = await service.getBundledVersion()

      expect(result).toBe(version)
    })

    it('should return null when package.json does not exist', async () => {
      mockFileSystem.existsSync.mockReturnValue(false)

      const result = await service.getBundledVersion()

      expect(result).toBeNull()
    })

    it('should return null when no bundled version is found', async () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
      }
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue(JSON.stringify(packageJson))

      const result = await service.getBundledVersion()

      expect(result).toBeNull()
    })

    it('should throw BUNDLED_VERSION_NOT_FOUND when JSON parsing fails', async () => {
      mockFileSystem.existsSync.mockReturnValue(true)
      mockFileSystem.readFile.mockResolvedValue('invalid json')

      await expect(service.getBundledVersion()).rejects.toMatchObject({
        type: VERSION_ERROR_TYPES.bundledVersionNotFound,
        message: expect.stringContaining('Failed to read bundled version'),
      })
    })
  })
})
