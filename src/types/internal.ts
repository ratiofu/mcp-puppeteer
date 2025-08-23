// Internal types for non-public API modules

/**
 * Configuration for the MCP server startup
 */
export interface ServerConfig {
  /** Unique identifier for the server session */
  sessionId: string;
  /** Chrome remote debugging port */
  chromeDebugPort?: number;
}

/**
 * Browser connection configuration
 */
export interface BrowserConnectionConfig {
  /** URL for connecting to Chrome remote debugging */
  browserURL: string;
  /** Default viewport settings */
  defaultViewport: null | { width: number; height: number };
}

/**
 * Server startup result
 */
export interface ServerStartupResult {
  /** Whether the server started successfully */
  success: boolean;
  /** Error message if startup failed */
  error?: string;
  /** Server session ID if successful */
  sessionId?: string;
}

/**
 * Browser initialization result
 */
export interface BrowserInitResult {
  /** Whether browser connection was successful */
  success: boolean;
  /** Error message if connection failed */
  error?: string;
  /** Browser instance if successful */
  browser?: import('puppeteer-core').Browser;
}

/**
 * Process signal types for graceful shutdown
 */
export type ProcessSignal = 'SIGINT' | 'SIGTERM';

/**
 * Server lifecycle events
 */
export interface ServerLifecycleEvents {
  /** Called when server starts successfully */
  onStart?: (sessionId: string) => void;
  /** Called when server receives shutdown signal */
  onShutdown?: (signal: ProcessSignal) => void;
  /** Called when transport closes */
  onTransportClose?: () => void;
  /** Called when server encounters an error */
  onError?: (error: Error) => void;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  CHROME_DEBUG_PORT: 9222,
  SESSION_ID: 'pipe-session',
  BROWSER_URL: 'http://localhost:9222'
} as const;

/**
 * Error messages for internal operations
 */
export const INTERNAL_ERROR_MESSAGES = {
  CHROME_CONNECTION_FAILED: 'Failed to connect to Chrome. Make sure Chrome is running with remote debugging enabled.',
  CHROME_LAUNCH_INSTRUCTION: 'Launch Chrome with: open -a "Google Chrome" --args --remote-debugging-port=9222',
  SERVER_STARTUP_FAILED: 'Error starting server',
  UNHANDLED_ERROR: 'Unhandled error',
  BROWSER_INIT_FAILED: 'Browser initialization failed',
  TRANSPORT_SETUP_FAILED: 'Transport setup failed'
} as const;