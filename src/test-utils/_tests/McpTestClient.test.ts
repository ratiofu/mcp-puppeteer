import type { Browser } from 'puppeteer-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ToolNames } from '../../types/api.js'
import { createMcpTestClient, McpTestClient } from '../McpTestClient.js'
import { getTestBrowser } from '../test-setup.js'

describe('McpTestClient', () => {
  let browser: Browser
  let client: McpTestClient
  const sessionId = 'test-session-mcp-client'

  beforeEach(async () => {
    browser = await getTestBrowser()
    client = new McpTestClient(sessionId, browser)
  })

  afterEach(async () => {
    if (client?.isInitialized()) {
      await client.disconnect()
    }
  })

  describe('initialization', () => {
    it('should create client without initialization', () => {
      expect(client).toBeDefined()
      expect(client.isInitialized()).toBe(false)
      expect(client.getSessionId()).toBe(sessionId)
    })

    it('should initialize successfully', async () => {
      await client.initialize()
      expect(client.isInitialized()).toBe(true)
    })

    it('should not initialize twice', async () => {
      await client.initialize()
      expect(client.isInitialized()).toBe(true)

      // Second initialization should not throw
      await client.initialize()
      expect(client.isInitialized()).toBe(true)
    })

    it('should create and initialize client with factory function', async () => {
      const factoryClient = await createMcpTestClient('factory-session', browser)
      expect(factoryClient.isInitialized()).toBe(true)
      expect(factoryClient.getSessionId()).toBe('factory-session')

      await factoryClient.disconnect()
    })
  })

  describe('tool listing', () => {
    beforeEach(async () => {
      await client.initialize()
    })

    it('should list available tools', async () => {
      const tools = await client.listTools()
      expect(tools.tools).toBeDefined()
      expect(Array.isArray(tools.tools)).toBe(true)
      expect(tools.tools.length).toBeGreaterThan(0)

      // Check that all expected tools are present
      const toolNames = tools.tools.map((tool) => tool.name)
      expect(toolNames).toContain(ToolNames.navigate)
      expect(toolNames).toContain(ToolNames.click)
      expect(toolNames).toContain(ToolNames.takeScreenshot)
      expect(toolNames).toContain(ToolNames.getHtml)
      expect(toolNames).toContain(ToolNames.getConsole)
      expect(toolNames).toContain(ToolNames.listTabUrls)
    })

    it('should fail to list tools when not initialized', async () => {
      const uninitializedClient = new McpTestClient('uninitialized', browser)

      await expect(uninitializedClient.listTools()).rejects.toThrow('Client not initialized')

      await uninitializedClient.disconnect()
    })
  })

  describe('tool calling', () => {
    beforeEach(async () => {
      await client.initialize()
    })

    it('should fail tool calls when not initialized', async () => {
      const uninitializedClient = new McpTestClient('uninitialized', browser)

      await expect(uninitializedClient.navigate('https://example.com')).rejects.toThrow(
        'Client not initialized',
      )

      await uninitializedClient.disconnect()
    })

    it('should call listTabUrls tool successfully', async () => {
      const response = await client.listTabUrls()
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })

    it('should call navigate tool successfully', async () => {
      const response = await client.navigate('https://example.com')
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })

    it('should call click tool successfully', async () => {
      const response = await client.click('body')
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })

    it('should call takeScreenshot tool successfully', async () => {
      const response = await client.takeScreenshot()
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })

    it('should call getHtml tool successfully', async () => {
      const response = await client.getHtml()
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })

    it('should call getConsole tool with default parameters', async () => {
      const response = await client.getConsole()
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })

    it('should call getConsole tool with clear parameter', async () => {
      const response = await client.getConsole(true)
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })

    it('should call generic callTool method', async () => {
      const response = await client.callTool(ToolNames.listTabUrls, {})
      expect(response).toBeDefined()
      expect(response.content).toBeDefined()
      expect(Array.isArray(response.content)).toBe(true)
      expect(response.isError).toBeDefined()
    })
  })

  describe('message history', () => {
    beforeEach(async () => {
      await client.initialize()
    })

    it('should track message history', async () => {
      // Make a tool call to generate messages
      await client.listTabUrls()

      const history = client.getMessageHistory()
      expect(history).toBeDefined()
      expect(history.clientToServer).toBeDefined()
      expect(history.serverToClient).toBeDefined()
      expect(Array.isArray(history.clientToServer)).toBe(true)
      expect(Array.isArray(history.serverToClient)).toBe(true)
    })

    it('should clear message history', async () => {
      // Make a tool call to generate messages
      await client.listTabUrls()

      let history = client.getMessageHistory()
      expect(history.clientToServer.length + history.serverToClient.length).toBeGreaterThan(0)

      client.clearMessageHistory()

      history = client.getMessageHistory()
      expect(history.clientToServer.length).toBe(0)
      expect(history.serverToClient.length).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle tool call errors gracefully', async () => {
      await client.initialize()

      // Close the client connection to trigger tool call error
      await client.disconnect()

      await expect(client.callTool(ToolNames.listTabUrls, {})).rejects.toThrow(
        'Client not initialized',
      )
    })

    it('should handle listTools errors when client is closed', async () => {
      await client.initialize()

      // Close the client connection to trigger listTools error
      await client.disconnect()

      await expect(client.listTools()).rejects.toThrow('Client not initialized')
    })
  })

  describe('cleanup', () => {
    it('should disconnect successfully', async () => {
      await client.initialize()
      expect(client.isInitialized()).toBe(true)

      await client.disconnect()
      expect(client.isInitialized()).toBe(false)
    })

    it('should handle disconnect when not initialized', async () => {
      expect(client.isInitialized()).toBe(false)

      // Should not throw
      await client.disconnect()
      expect(client.isInitialized()).toBe(false)
    })

    it('should handle multiple disconnects', async () => {
      await client.initialize()

      await client.disconnect()
      expect(client.isInitialized()).toBe(false)

      // Second disconnect should not throw
      await client.disconnect()
      expect(client.isInitialized()).toBe(false)
    })

    it('should handle disconnect errors gracefully', async () => {
      await client.initialize()

      // The disconnect method is designed to be robust and not throw errors
      // This test verifies that it handles cleanup gracefully
      await client.disconnect()
      expect(client.isInitialized()).toBe(false)
    })
  })
})
