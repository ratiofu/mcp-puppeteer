// Browser discovery module exports
export { BrowserInstallation } from './BrowserInstallation.js';
export type { LaunchOptions, BrowserExecutableInfo } from './BrowserInstallation.js';
export { findChromiumExecutable } from './findChromiumExecutable.js';
export { BrowserDiscoveryService } from './BrowserDiscoveryService.js';
export type { FindBestBrowserRequest, CheckRunningBrowserRequest } from './BrowserDiscoveryService.js';
export { isTruthy } from './envUtils.js';