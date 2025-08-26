import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { initBrowser } from './initBrowser'
import { PuppeteerMcpServer } from './PuppeteerMcpServer'
import {
  DEFAULT_CONFIG,
  INTERNAL_ERROR_MESSAGES,
  type ProcessSignal,
  type ServerConfig,
  type ServerLifecycleEvents,
} from './types/index'
import { errorToString } from './utils/error'

/**
 * Default server configuration
 */
const defaultConfig: ServerConfig = {
  sessionId: DEFAULT_CONFIG.sessionId,
  chromiumDebugPort: DEFAULT_CONFIG.chromiumDebugPort,
}

/**
 * Setup graceful shutdown handlers for the server
 */
function setupShutdownHandlers(server: PuppeteerMcpServer, events?: ServerLifecycleEvents): void {
  const handleShutdown = async (signal: ProcessSignal) => {
    console.error(`Received ${signal}, cleaning up...`)
    events?.onShutdown?.(signal)
    await server.disconnect()
    process.exit(0)
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'))
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
}

/**
 * Initialize and start the MCP server with pipe transport
 */
async function startServer(
  config: ServerConfig = defaultConfig,
  events?: ServerLifecycleEvents,
): Promise<void> {
  try {
    // Initialize browser
    console.error('Connecting to Chromium...')
    const browser = await initBrowser()
    console.error('Successfully connected to Chromium')

    // Create transport and server
    const transport = new StdioServerTransport()
    const server = new PuppeteerMcpServer(config.sessionId, browser)

    // Setup graceful shutdown
    setupShutdownHandlers(server, events)

    // Handle transport close
    transport.onclose = async () => {
      console.error('Transport closed, cleaning up...')
      events?.onTransportClose?.()
      await server.disconnect()
      process.exit(0)
    }

    // Connect transport and server
    await server.connect(transport)
    console.error('MCP server started with pipe transport')
    events?.onStart?.(config.sessionId)
  } catch (error) {
    const errorMessage = errorToString(error)
    console.error(`${INTERNAL_ERROR_MESSAGES.serverStartupFailed}:`, errorMessage)
    events?.onError?.(error instanceof Error ? error : new Error(errorMessage))
    process.exit(1)
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  await startServer()
}

// Start the server
main().catch((error) => {
  console.error(`${INTERNAL_ERROR_MESSAGES.unhandledError}:`, errorToString(error))
  process.exit(1)
})

// Export for testing
export { startServer, setupShutdownHandlers, defaultConfig }
