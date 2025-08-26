// Browser discovery module exports

// Re-export IO interfaces from the io module
export type { FileSystemOperations, ProcessOperations } from '../io/index.js'
export {
  ConcreteFileSystemOperations as DefaultFileSystemOperations,
  ConcreteProcessOperations as DefaultProcessOperations,
} from '../io/index.js'
export type {
  CheckRunningBrowserRequest,
  FindBestBrowserRequest,
} from './BrowserDiscoveryService.js'
export { BrowserDiscoveryService } from './BrowserDiscoveryService.js'
export type { BrowserExecutableInfo, LaunchOptions } from './BrowserInstallation.js'
export { BrowserInstallation } from './BrowserInstallation.js'
export type {
  BrowserInstallationFactory,
  ChromeForTestingApiInterface,
  CleanupResponse,
  InstallationResult,
  InstallChromiumManagerRequest,
} from './BrowserManagerService.js'
export {
  BrowserManagerService,
  DefaultBrowserInstallationFactory,
} from './BrowserManagerService.js'
export { isTruthy } from './envUtils.js'
export { findChromiumExecutable } from './findChromiumExecutable.js'
