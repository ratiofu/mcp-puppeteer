import type { Dirent, MakeDirectoryOptions, Mode, ObjectEncodingOptions, RmOptions } from 'node:fs'

export type ReadDirOptions =
  | (ObjectEncodingOptions & { withFileTypes?: boolean; recursive?: boolean })
  | BufferEncoding
  | null

export type MakeDirOptions = Mode | MakeDirectoryOptions | null

export type RemoveOptions = RmOptions

/**
 * File system operations interface for dependency injection
 */
export interface FileSystemOperations {
  mkdir(path: string, options?: MakeDirOptions): Promise<void>
  readdir(path: string, options?: ReadDirOptions): Promise<(string | Dirent)[]>
  rm(path: string, options?: RemoveOptions): Promise<void>
  stat(path: string): Promise<{ mode: number; isDirectory(): boolean; isFile(): boolean }>
  existsSync(path: string): boolean
  writeFile(path: string, content: string): Promise<void>
  readFile(path: string, encoding?: string): Promise<string>
  chmod(path: string, mode: number): Promise<void>
}
