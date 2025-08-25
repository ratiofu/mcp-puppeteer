/**
 * File system operations interface for dependency injection
 */
export interface FileSystemOperations {
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: string, options?: { withFileTypes?: boolean }): Promise<any[]>;
  rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  stat(path: string): Promise<{ mode: number; isDirectory(): boolean; isFile(): boolean }>;
  existsSync(path: string): boolean;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string, encoding?: string): Promise<string>;
  chmod(path: string, mode: number): Promise<void>;
}