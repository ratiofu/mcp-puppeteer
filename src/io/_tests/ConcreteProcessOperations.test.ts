import { beforeEach, describe, expect, it } from 'vitest'
import { ConcreteProcessOperations } from '../ConcreteProcessOperations.js'

describe('ConcreteProcessOperations', () => {
  let process: ConcreteProcessOperations

  beforeEach(() => {
    process = new ConcreteProcessOperations()
  })

  describe('execSync', () => {
    it('should execute a simple command and return output', () => {
      const result = process.execSync('echo "Hello, World!"')
      expect(result.trim()).toBe('Hello, World!')
    })

    it('should execute commands with arguments', () => {
      const result = process.execSync('node --version')
      expect(result).toMatch(/^v\d+\.\d+\.\d+/)
    })

    it('should handle command options', () => {
      const result = process.execSync('pwd', { cwd: '/' })
      expect(result.trim()).toBe('/')
    })

    it('should throw error for invalid commands', () => {
      expect(() => {
        process.execSync('nonexistent-command-12345')
      }).toThrow()
    })

    it('should handle commands that return non-zero exit codes', () => {
      expect(() => {
        process.execSync('node -e "process.exit(1)"')
      }).toThrow()
    })

    it('should return output as string with utf8 encoding by default', () => {
      const result = process.execSync('echo "test"')
      expect(typeof result).toBe('string')
      expect(result.trim()).toBe('test')
    })
  })

  describe('getEnv', () => {
    it('should return environment variable value when it exists', () => {
      // NODE_ENV should exist in test environment
      const result = process.getEnv('NODE_ENV')
      expect(typeof result).toBe('string')
    })

    it('should return undefined for non-existent environment variables', () => {
      const result = process.getEnv('NON_EXISTENT_VAR_12345')
      expect(result).toBeUndefined()
    })

    it('should return PATH environment variable', () => {
      const result = process.getEnv('PATH')
      expect(typeof result).toBe('string')
      expect(result?.length).toBeGreaterThan(0)
    })
  })
})
