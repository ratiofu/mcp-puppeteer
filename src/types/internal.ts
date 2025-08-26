// Internal types for non-public API modules

/**
 * Configuration for the MCP server startup
 */
export interface ServerConfig {
  /** Unique identifier for the server session */
  sessionId: string
  /** Chromium remote debugging port */
  chromiumDebugPort?: number
}

/**
 * Browser connection configuration
 */
export interface BrowserConnectionConfig {
  /** URL for connecting to Chromium remote debugging */
  // biome-ignore lint/style/useNamingConvention: that's what Chrome expects
  browserURL: string
  /** Default viewport settings */
  defaultViewport: null | { width: number; height: number }
}

/**
 * Server startup result
 */
export interface ServerStartupResult {
  /** Whether the server started successfully */
  success: boolean
  /** Error message if startup failed */
  error?: string
  /** Server session ID if successful */
  sessionId?: string
}

/**
 * Browser initialization result
 */
export interface BrowserInitResult {
  /** Whether browser connection was successful */
  success: boolean
  /** Error message if connection failed */
  error?: string
  /** Browser instance if successful */
  browser?: import('puppeteer-core').Browser
}

/**
 * Process signal types for graceful shutdown
 */
export type ProcessSignal = 'SIGINT' | 'SIGTERM'

/**
 * Server lifecycle events
 */
export interface ServerLifecycleEvents {
  /** Called when server starts successfully */
  onStart?: (sessionId: string) => void
  /** Called when server receives shutdown signal */
  onShutdown?: (signal: ProcessSignal) => void
  /** Called when transport closes */
  onTransportClose?: () => void
  /** Called when server encounters an error */
  onError?: (error: Error) => void
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  chromiumDebugPort: 9222,
  sessionId: 'pipe-session',
  // biome-ignore lint/style/useNamingConvention: that's what Chrome expects
  browserURL: 'http://localhost:9222',
} as const

/**
 * Error messages for internal operations
 */
export const INTERNAL_ERROR_MESSAGES = {
  chromiumConnectionFailed:
    'Failed to connect to Chromium. Make sure Chromium is running with remote debugging enabled.',
  chromiumLaunchInstructions: 'Launch Chromium with: chromium --remote-debugging-port=9222',
  serverStartupFailed: 'Error starting server',
  unhandledError: 'Unhandled error',
  browserInitFailed: 'Browser initialization failed',
  transportSetupFailed: 'Transport setup failed',
} as const
