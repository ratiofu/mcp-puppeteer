import { mkdir, readdir, rm, stat, writeFile, readFile, chmod } from 'fs/promises';
import { existsSync } from 'fs';
import type { FileSystemOperations } from './FileSystemOperations.js';

/**
 * Concrete implementation of file system operations using Node.js fs module
 */
export class ConcreteFileSystemOperations implements FileSystemOperations {
  async mkdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    await mkdir(path, options);
  }

  async readdir(path: string, options?: { withFileTypes?: boolean }): Promise<any[]> {
    return await readdir(path, options as any);
  }

  async rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void> {
    await rm(path, options);
  }

  async stat(path: string): Promise<{ mode: number; isDirectory(): boolean; isFile(): boolean }> {
    return await stat(path);
  }

  existsSync(path: string): boolean {
    return existsSync(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    await writeFile(path, content);
  }

  async readFile(path: string, encoding: string = 'utf-8'): Promise<string> {
    return await readFile(path, { encoding: encoding as BufferEncoding });
  }

  async chmod(path: string, mode: number): Promise<void> {
    await chmod(path, mode);
  }
}