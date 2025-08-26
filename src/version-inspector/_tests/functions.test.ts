import { describe, expect, it } from 'vitest'
import { checkCompatibility, compareVersions, parseVersion } from '../functions.js'
import { VERSION_ERROR_TYPES } from '../types.js'

describe('Version Functions', () => {
  describe('parseVersion', () => {
    it('should parse valid version string correctly', () => {
      const result = parseVersion('120.0.6099.109')

      expect(result).toEqual({
        major: 120,
        minor: 0,
        patch: 6099,
        build: 109,
        original: '120.0.6099.109',
      })
    })

    it('should parse version with different numbers correctly', () => {
      const result = parseVersion('121.5.6167.85')

      expect(result).toEqual({
        major: 121,
        minor: 5,
        patch: 6167,
        build: 85,
        original: '121.5.6167.85',
      })
    })

    it('should throw error for invalid version format - too few parts', () => {
      expect(() => parseVersion('120.0.6099')).toThrow(
        expect.objectContaining({
          type: VERSION_ERROR_TYPES.invalidVersionFormat,
          message: expect.stringContaining('Invalid version format'),
        }),
      )
    })

    it('should throw error for invalid version format - too many parts', () => {
      expect(() => parseVersion('120.0.6099.109.1')).toThrow(
        expect.objectContaining({
          type: VERSION_ERROR_TYPES.invalidVersionFormat,
          message: expect.stringContaining('Invalid version format'),
        }),
      )
    })

    it('should throw error for invalid version format - non-numeric parts', () => {
      expect(() => parseVersion('120.0.abc.109')).toThrow(
        expect.objectContaining({
          type: VERSION_ERROR_TYPES.invalidVersionFormat,
          message: expect.stringContaining('Invalid version format'),
        }),
      )
    })

    it('should throw error for empty version string', () => {
      expect(() => parseVersion('')).toThrow(
        expect.objectContaining({
          type: VERSION_ERROR_TYPES.invalidVersionFormat,
          message: expect.stringContaining('Invalid version format'),
        }),
      )
    })
  })

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      const version1 = parseVersion('120.0.6099.109')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(0)
      expect(result.description).toContain('is equal to')
    })

    it('should return 1 when first version has higher major version', () => {
      const version1 = parseVersion('121.0.6099.109')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(1)
      expect(result.description).toContain('newer major version')
    })

    it('should return -1 when first version has lower major version', () => {
      const version1 = parseVersion('119.0.6099.109')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(-1)
      expect(result.description).toContain('older major version')
    })

    it('should return 1 when first version has higher minor version', () => {
      const version1 = parseVersion('120.1.6099.109')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(1)
      expect(result.description).toContain('newer minor version')
    })

    it('should return -1 when first version has lower minor version', () => {
      const version1 = parseVersion('120.0.6099.109')
      const version2 = parseVersion('120.1.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(-1)
      expect(result.description).toContain('older minor version')
    })

    it('should return 1 when first version has higher patch version', () => {
      const version1 = parseVersion('120.0.6100.109')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(1)
      expect(result.description).toContain('newer patch version')
    })

    it('should return -1 when first version has lower patch version', () => {
      const version1 = parseVersion('120.0.6098.109')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(-1)
      expect(result.description).toContain('older patch version')
    })

    it('should return 1 when first version has higher build version', () => {
      const version1 = parseVersion('120.0.6099.110')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(1)
      expect(result.description).toContain('newer build version')
    })

    it('should return -1 when first version has lower build version', () => {
      const version1 = parseVersion('120.0.6099.108')
      const version2 = parseVersion('120.0.6099.109')

      const result = compareVersions(version1, version2)

      expect(result.result).toBe(-1)
      expect(result.description).toContain('older build version')
    })
  })

  describe('checkCompatibility', () => {
    it('should return compatible when no required version is specified', () => {
      const result = checkCompatibility('120.0.6099.109')

      expect(result).toEqual({
        compatible: true,
        installedVersion: '120.0.6099.109',
        recommendation: 'ok',
      })
    })

    it('should return compatible when installed version equals required', () => {
      const version = '120.0.6099.109'
      const result = checkCompatibility(version, version)

      expect(result).toEqual({
        compatible: true,
        installedVersion: version,
        requiredVersion: version,
        recommendation: 'ok',
      })
    })

    it('should return compatible when installed version is newer than required', () => {
      const result = checkCompatibility('121.0.6167.85', '120.0.6099.109')

      expect(result).toEqual({
        compatible: true,
        installedVersion: '121.0.6167.85',
        requiredVersion: '120.0.6099.109',
        recommendation: 'ok',
      })
    })

    it('should return incompatible when installed version is older than required', () => {
      const result = checkCompatibility('119.0.6045.105', '120.0.6099.109')

      expect(result).toEqual({
        compatible: false,
        installedVersion: '119.0.6045.105',
        requiredVersion: '120.0.6099.109',
        recommendation: 'upgrade',
      })
    })

    it('should return incompatible when version parsing fails', () => {
      const result = checkCompatibility('invalid-version', '120.0.6099.109')

      expect(result).toEqual({
        compatible: false,
        installedVersion: 'invalid-version',
        requiredVersion: '120.0.6099.109',
        recommendation: 'upgrade',
      })
    })
  })
})
