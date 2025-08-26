import { type Dirent, existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ConcreteFileSystemOperations } from '../ConcreteFileSystemOperations.js'

describe('ConcreteFileSystemOperations', () => {
  let fs: ConcreteFileSystemOperations
  let tempDir: string

  beforeEach(async () => {
    fs = new ConcreteFileSystemOperations()
    tempDir = join(
      tmpdir(),
      `fs-ops-test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    )
  })

  afterEach(async () => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  describe('mkdir', () => {
    it('should create a directory', async () => {
      await fs.mkdir(tempDir)
      expect(fs.existsSync(tempDir)).toBe(true)
    })

    it('should create nested directories with recursive option', async () => {
      const nestedDir = join(tempDir, 'nested', 'deep')
      await fs.mkdir(nestedDir, { recursive: true })
      expect(fs.existsSync(nestedDir)).toBe(true)
    })
  })

  describe('writeFile, readFile and readdir', () => {
    it('should write a file and list directory contents', async () => {
      await fs.mkdir(tempDir)
      const filePath = join(tempDir, 'test.txt')
      const content = 'Hello, World!'

      await fs.writeFile(filePath, content)
      expect(fs.existsSync(filePath)).toBe(true)

      const entries = await fs.readdir(tempDir)
      expect(entries).toContain('test.txt')
    })

    it('should read file contents', async () => {
      await fs.mkdir(tempDir)
      const filePath = join(tempDir, 'test.txt')
      const content = 'Hello, World!'

      await fs.writeFile(filePath, content)
      const readContent = await fs.readFile(filePath)
      expect(readContent).toBe(content)
    })

    it('should read file with different encoding', async () => {
      await fs.mkdir(tempDir)
      const filePath = join(tempDir, 'test.txt')
      const content = 'Hello, World!'

      await fs.writeFile(filePath, content)
      const readContent = await fs.readFile(filePath, 'utf8')
      expect(readContent).toBe(content)
    })

    it('should list directory contents with file types', async () => {
      await fs.mkdir(tempDir)
      const filePath = join(tempDir, 'test.txt')
      const subDir = join(tempDir, 'subdir')

      await fs.writeFile(filePath, 'content')
      await fs.mkdir(subDir)

      const entries = (await fs.readdir(tempDir, { withFileTypes: true })) as Dirent[]
      expect(entries).toHaveLength(2)

      const file = entries.find((e) => e.name === 'test.txt')
      const dir = entries.find((e) => e.name === 'subdir')

      expect(file?.isFile()).toBe(true)
      expect(dir?.isDirectory()).toBe(true)
    })
  })

  describe('stat', () => {
    it('should return file stats', async () => {
      await fs.mkdir(tempDir)
      const filePath = join(tempDir, 'test.txt')
      await fs.writeFile(filePath, 'content')

      const stats = await fs.stat(filePath)
      expect(stats.isFile()).toBe(true)
      expect(stats.isDirectory()).toBe(false)
      expect(typeof stats.mode).toBe('number')
    })

    it('should return directory stats', async () => {
      await fs.mkdir(tempDir)

      const stats = await fs.stat(tempDir)
      expect(stats.isFile()).toBe(false)
      expect(stats.isDirectory()).toBe(true)
    })
  })

  describe('chmod', () => {
    it('should change file permissions', async () => {
      await fs.mkdir(tempDir)
      const filePath = join(tempDir, 'test.txt')
      await fs.writeFile(filePath, 'content')

      // Make file executable
      await fs.chmod(filePath, 0o755)

      const stats = await fs.stat(filePath)
      // Check that executable bit is set (at least for owner)
      expect(stats.mode & 0o100).toBeGreaterThan(0)
    })
  })

  describe('rm', () => {
    it('should remove a file', async () => {
      await fs.mkdir(tempDir)
      const filePath = join(tempDir, 'test.txt')
      await fs.writeFile(filePath, 'content')

      expect(fs.existsSync(filePath)).toBe(true)
      await fs.rm(filePath)
      expect(fs.existsSync(filePath)).toBe(false)
    })

    it('should remove a directory recursively', async () => {
      const nestedDir = join(tempDir, 'nested', 'deep')
      await fs.mkdir(nestedDir, { recursive: true })
      await fs.writeFile(join(nestedDir, 'file.txt'), 'content')

      expect(fs.existsSync(tempDir)).toBe(true)
      await fs.rm(tempDir, { recursive: true, force: true })
      expect(fs.existsSync(tempDir)).toBe(false)
    })
  })

  describe('existsSync', () => {
    it('should return true for existing paths', async () => {
      await fs.mkdir(tempDir)
      expect(fs.existsSync(tempDir)).toBe(true)
    })

    it('should return false for non-existing paths', () => {
      expect(fs.existsSync(join(tempDir, 'nonexistent'))).toBe(false)
    })
  })
})
