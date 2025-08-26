import type { ExecSyncOptions } from 'node:child_process'

/**
 * Process operations interface for dependency injection
 */
export interface ProcessOperations {
  execSync(command: string, options?: ExecSyncOptions): string
  getEnv(key: string): string | undefined
}
