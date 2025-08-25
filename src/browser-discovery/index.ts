// Browser discovery module exports
export { BrowserInstallation } from './BrowserInstallation.js';
export type { LaunchOptions, BrowserExecutableInfo } from './BrowserInstallation.js';
export { findChromiumExecutable } from './findChromiumExecutable.js';
export { BrowserDiscoveryService } from './BrowserDiscoveryService.js';
export type { FindBestBrowserRequest, CheckRunningBrowserRequest } from './BrowserDiscoveryService.js';
export { BrowserManagerService } from './BrowserManagerService.js';
export type { 
  InstallChromiumManagerRequest, 
  InstallationResult, 
  CleanupResponse,
  ChromeForTestingAPIInterface,
  BrowserInstallationFactory
} from './BrowserManagerService.js';
export { 
  DefaultBrowserInstallationFactory
} from './BrowserManagerService.js';
// Re-export IO interfaces from the io module
export type { FileSystemOperations, ProcessOperations } from '../io/index.js';
export { ConcreteFileSystemOperations as DefaultFileSystemOperations, ConcreteProcessOperations as DefaultProcessOperations } from '../io/index.js';
export { isTruthy } from './envUtils.js';