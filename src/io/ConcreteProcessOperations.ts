import { execSync, type ExecSyncOptions } from 'child_process';
import type { ProcessOperations } from './ProcessOperations.js';

/**
 * Concrete implementation of process operations using Node.js child_process module
 */
export class ConcreteProcessOperations implements ProcessOperations {
  execSync(command: string, options?: ExecSyncOptions): string {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options }) as string;
  }

  getEnv(key: string): string | undefined {
    return process.env[key];
  }
}