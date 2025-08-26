import { type Dirent, existsSync } from 'node:fs'
import { chmod, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import type {
  FileSystemOperations,
  MakeDirOptions,
  ReadDirOptions,
  RemoveOptions,
} from './FileSystemOperations.js'

type ExtractOptionsType<T> = T extends (
  first: unknown,
  options?: infer O,
  ...rest: unknown[]
) => unknown
  ? O
  : T extends (first: unknown, options: infer O, ...rest: unknown[]) => unknown
    ? O
    : never

/**
 * Concrete implementation of file system operations using Node.js fs module
 */
export class ConcreteFileSystemOperations implements FileSystemOperations {
  async mkdir(path: string, options?: MakeDirOptions): Promise<void> {
    await mkdir(path, options)
  }

  async readdir(path: string, options?: ReadDirOptions): Promise<(string | Dirent)[]> {
    return await readdir(path, options as unknown as ExtractOptionsType<typeof readdir>)
  }

  async rm(path: string, options?: RemoveOptions): Promise<void> {
    await rm(path, options)
  }

  async stat(path: string): Promise<{ mode: number; isDirectory(): boolean; isFile(): boolean }> {
    return await stat(path)
  }

  existsSync(path: string): boolean {
    return existsSync(path)
  }

  async writeFile(path: string, content: string): Promise<void> {
    await writeFile(path, content)
  }

  async readFile(path: string, encoding = 'utf-8'): Promise<string> {
    return await readFile(path, { encoding: encoding as BufferEncoding })
  }

  async chmod(path: string, mode: number): Promise<void> {
    await chmod(path, mode)
  }
}
