import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findChromiumExecutable } from '../findChromiumExecutable.js'

describe('findChromiumExecutable', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('environment variable handling', () => {
    it('should throw error when DISABLE_LOCAL_CHROMIUM_DISCOVERY is set', () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = '1'

      expect(() => findChromiumExecutable()).toThrow(
        'Local Chromium discovery disabled by configuration',
      )
    })

    it('should throw error when skipLocalDiscovery parameter is true', () => {
      expect(() => findChromiumExecutable(true)).toThrow(
        'Local Chromium discovery disabled by configuration',
      )
    })

    it('should proceed normally when DISABLE_LOCAL_CHROMIUM_DISCOVERY is not set', () => {
      delete process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY

      // This will use the real system to find chromium, which should work on this system
      const result = findChromiumExecutable()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('function behavior', () => {
    it('should return a valid path when called', () => {
      delete process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY

      const result = findChromiumExecutable()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      // Should be an absolute path
      expect(result.startsWith('/')).toBe(true)
    })

    it('should handle skipLocalDiscovery parameter correctly', () => {
      // Test that the parameter works
      expect(() => findChromiumExecutable(false)).not.toThrow()
      expect(() => findChromiumExecutable(true)).toThrow(
        'Local Chromium discovery disabled by configuration',
      )
    })

    it('should respect environment variable over parameter', () => {
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = '1'

      // Even with false parameter, env var should take precedence
      expect(() => findChromiumExecutable(false)).toThrow(
        'Local Chromium discovery disabled by configuration',
      )
    })

    it('should handle different environment variable values', () => {
      // Test with '1' value
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = '1'
      expect(() => findChromiumExecutable()).toThrow(
        'Local Chromium discovery disabled by configuration',
      )

      // Test with other values (should not disable)
      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = '0'
      expect(() => findChromiumExecutable()).not.toThrow()

      process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY = 'false'
      expect(() => findChromiumExecutable()).not.toThrow()

      // Test with undefined
      delete process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY
      expect(() => findChromiumExecutable()).not.toThrow()
    })

    it('should return consistent results when called multiple times', () => {
      delete process.env.DISABLE_LOCAL_CHROMIUM_DISCOVERY

      const result1 = findChromiumExecutable()
      const result2 = findChromiumExecutable()

      // Should return the same path (first successful discovery)
      expect(result1).toBe(result2)
    })
  })
})
