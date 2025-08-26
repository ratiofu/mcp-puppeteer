import type { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage, MessageExtraInfo } from '@modelcontextprotocol/sdk/types.js'

/**
 * In-memory transport for testing MCP communication
 * Provides bidirectional message routing between client and server instances
 */
export class TestTransport implements Transport {
  private serverToClientMessages: JSONRPCMessage[] = []
  private clientToServerMessages: JSONRPCMessage[] = []
  private isServerSide: boolean
  private closed = false
  private connectedTransport?: TestTransport
  private started = false

  // Transport interface properties
  public sessionId?: string
  public onclose?: () => void
  public onerror?: (error: Error) => void
  public onmessage?: (message: JSONRPCMessage, extra?: MessageExtraInfo) => void

  constructor(isServerSide = false, sessionId?: string) {
    this.isServerSide = isServerSide
    this.sessionId =
      sessionId || `test-session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Connect this transport to another TestTransport for bidirectional communication
   * @param otherTransport The transport to connect to
   */
  connect(otherTransport: TestTransport): void {
    this.connectedTransport = otherTransport
    otherTransport.connectedTransport = this
  }

  /**
   * Start the transport (required by Transport interface)
   */
  async start(): Promise<void> {
    if (this.started) {
      return
    }
    this.started = true
  }

  /**
   * Send a message through the transport
   * Messages are routed to the connected transport's message handler
   */
  async send(message: JSONRPCMessage, _options?: TransportSendOptions): Promise<void> {
    if (this.closed) {
      throw new Error('Transport is closed')
    }

    if (!this.started) {
      throw new Error('Transport not started')
    }

    if (!this.connectedTransport) {
      throw new Error('Transport not connected to another transport')
    }

    // Route message to the connected transport
    if (this.isServerSide) {
      // Server sending to client
      this.connectedTransport.serverToClientMessages.push(message)
      if (this.connectedTransport.onmessage) {
        // Deliver message asynchronously to simulate real transport behavior
        setImmediate(() => {
          if (this.connectedTransport?.onmessage && !this.closed) {
            this.connectedTransport.onmessage(message)
          }
        })
      }
    } else {
      // Client sending to server
      this.connectedTransport.clientToServerMessages.push(message)
      if (this.connectedTransport.onmessage) {
        // Deliver message asynchronously to simulate real transport behavior
        setImmediate(() => {
          if (this.connectedTransport?.onmessage && !this.closed) {
            this.connectedTransport.onmessage(message)
          }
        })
      }
    }
  }

  /**
   * Set the protocol version (required by Transport interface)
   */
  setProtocolVersion?(_version: string): void {
    // No-op for test transport
  }

  /**
   * Close the transport and clean up resources
   */
  async close(): Promise<void> {
    if (this.closed) {
      return
    }

    this.closed = true
    this.started = false

    // Call onclose callback if set
    if (this.onclose) {
      this.onclose()
    }

    // Clear message handlers
    this.onmessage = undefined

    // Clear message queues
    this.serverToClientMessages.length = 0
    this.clientToServerMessages.length = 0

    // Disconnect from connected transport
    if (this.connectedTransport) {
      this.connectedTransport.connectedTransport = undefined
      this.connectedTransport = undefined
    }
  }

  /**
   * Check if the transport is closed
   */
  get isClosed(): boolean {
    return this.closed
  }

  /**
   * Get all messages sent from server to client (for testing purposes)
   */
  getServerToClientMessages(): JSONRPCMessage[] {
    return [...this.serverToClientMessages]
  }

  /**
   * Get all messages sent from client to server (for testing purposes)
   */
  getClientToServerMessages(): JSONRPCMessage[] {
    return [...this.clientToServerMessages]
  }

  /**
   * Clear all message history (for testing purposes)
   */
  clearMessageHistory(): void {
    this.serverToClientMessages.length = 0
    this.clientToServerMessages.length = 0
  }
}

/**
 * Create a pair of connected TestTransports for client-server communication
 * @param sessionId Optional session ID for the transports
 * @returns Object containing client and server transport instances
 */
export function createTransportPair(sessionId?: string): {
  clientTransport: TestTransport
  serverTransport: TestTransport
} {
  const clientTransport = new TestTransport(false, sessionId)
  const serverTransport = new TestTransport(true, sessionId)

  clientTransport.connect(serverTransport)

  return { clientTransport, serverTransport }
}
