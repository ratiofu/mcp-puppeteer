import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestTransport, createTransportPair } from '../TestTransport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * Factory function to create test messages with proper typing
 */
function createTestMessage(options: {
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  id?: string | number;
} = {}): JSONRPCMessage {
  const { method, params = {}, result = {}, id = 1 } = options;

  const message = method
    ? { jsonrpc: '2.0' as const, id, method, params }
    : { jsonrpc: '2.0' as const, id, result };

  return Object.freeze(message);
}

describe('TestTransport', () => {
  let clientTransport: TestTransport;
  let serverTransport: TestTransport;

  beforeEach(() => {
    const pair = createTransportPair();
    clientTransport = pair.clientTransport;
    serverTransport = pair.serverTransport;
  });

  describe('Basic functionality', () => {
    it('should create transport pair with proper connection', () => {
      expect(clientTransport).toBeDefined();
      expect(serverTransport).toBeDefined();
      expect(clientTransport.isClosed).toBe(false);
      expect(serverTransport.isClosed).toBe(false);
      expect(clientTransport.sessionId).toBeDefined();
      expect(serverTransport.sessionId).toBeDefined();
    });

    it('should allow setting message handlers', () => {
      const clientHandler = vi.fn();
      const serverHandler = vi.fn();

      clientTransport.onmessage = clientHandler;
      serverTransport.onmessage = serverHandler;

      // Handlers should be set without throwing
      expect(clientTransport.onmessage).toBe(clientHandler);
      expect(serverTransport.onmessage).toBe(serverHandler);
    });

    it('should start transport properly', async () => {
      await expect(clientTransport.start()).resolves.toBeUndefined();
      await expect(serverTransport.start()).resolves.toBeUndefined();

      // Starting again should not throw
      await expect(clientTransport.start()).resolves.toBeUndefined();
    });
  });

  describe('Message routing', () => {
    beforeEach(async () => {
      await clientTransport.start();
      await serverTransport.start();
    });

    it('should route messages from client to server', async () => {
      const serverHandler = vi.fn();
      serverTransport.onmessage = serverHandler;

      const testMessage = createTestMessage({ method: 'test', params: { data: 'client-to-server' } });
      await clientTransport.send(testMessage);

      // Wait for async message delivery
      await new Promise(resolve => setImmediate(resolve));

      expect(serverHandler).toHaveBeenCalledWith(testMessage);
      expect(serverTransport.getClientToServerMessages()).toContain(testMessage);
    });

    it('should route messages from server to client', async () => {
      const clientHandler = vi.fn();
      clientTransport.onmessage = clientHandler;

      const testMessage = createTestMessage({ result: { data: 'server-to-client' } });
      await serverTransport.send(testMessage);

      // Wait for async message delivery
      await new Promise(resolve => setImmediate(resolve));

      expect(clientHandler).toHaveBeenCalledWith(testMessage);
      expect(clientTransport.getServerToClientMessages()).toContain(testMessage);
    });

    it('should handle bidirectional communication', async () => {
      const clientHandler = vi.fn();
      const serverHandler = vi.fn();

      clientTransport.onmessage = clientHandler;
      serverTransport.onmessage = serverHandler;

      const clientMessage = createTestMessage({ method: 'test' });
      const serverMessage = createTestMessage({ result: {} });

      await clientTransport.send(clientMessage);
      await serverTransport.send(serverMessage);

      // Wait for async message delivery
      await new Promise(resolve => setImmediate(resolve));

      expect(serverHandler).toHaveBeenCalledWith(clientMessage);
      expect(clientHandler).toHaveBeenCalledWith(serverMessage);
    });

    it('should prevent sending before start', async () => {
      const newTransport = new TestTransport();
      const testMessage = createTestMessage({ method: 'test' });

      await expect(newTransport.send(testMessage))
        .rejects.toThrow('Transport not started');
    });
  });

  describe('Resource management', () => {
    it('should close transport properly', async () => {
      const onCloseHandler = vi.fn();
      clientTransport.onclose = onCloseHandler;

      await clientTransport.close();

      expect(clientTransport.isClosed).toBe(true);
      expect(onCloseHandler).toHaveBeenCalled();
    });

    it('should prevent sending messages after close', async () => {
      await clientTransport.start();
      await clientTransport.close();

      const testMessage = createTestMessage({ method: 'test' });
      await expect(clientTransport.send(testMessage))
        .rejects.toThrow('Transport is closed');
    });

    it('should clear message history', async () => {
      await clientTransport.start();
      await serverTransport.start();

      const testMessage = createTestMessage({ method: 'test' });

      // Send a message to populate history
      await clientTransport.send(testMessage);

      expect(serverTransport.getClientToServerMessages()).toHaveLength(1);

      serverTransport.clearMessageHistory();

      expect(serverTransport.getClientToServerMessages()).toHaveLength(0);
      expect(serverTransport.getServerToClientMessages()).toHaveLength(0);
    });

    it('should handle cleanup when transport is closed', async () => {
      const clientHandler = vi.fn();
      const serverHandler = vi.fn();

      await clientTransport.start();
      await serverTransport.start();

      clientTransport.onmessage = clientHandler;
      serverTransport.onmessage = serverHandler;

      await clientTransport.close();

      // After client transport is closed, server transport should also be disconnected
      // and should throw an error when trying to send
      const testMessage = createTestMessage({ method: 'test' });
      await expect(serverTransport.send(testMessage))
        .rejects.toThrow('Transport not connected to another transport');

      expect(clientHandler).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should throw error when sending without connection', async () => {
      const isolatedTransport = new TestTransport();
      await isolatedTransport.start();

      const testMessage = createTestMessage({ method: 'test' });
      await expect(isolatedTransport.send(testMessage))
        .rejects.toThrow('Transport not connected to another transport');
    });

    it('should handle multiple close calls gracefully', async () => {
      await clientTransport.close();

      // Second close should not throw
      await expect(clientTransport.close()).resolves.toBeUndefined();
    });

    it('should handle error callback', () => {
      const errorHandler = vi.fn();
      clientTransport.onerror = errorHandler;

      const testError = new Error('Test error');
      if (clientTransport.onerror) {
        clientTransport.onerror(testError);
      }

      expect(errorHandler).toHaveBeenCalledWith(testError);
    });
  });

  describe('Message history tracking', () => {
    beforeEach(async () => {
      await clientTransport.start();
      await serverTransport.start();
    });

    it('should track client-to-server messages', async () => {
      const message1 = createTestMessage({ method: 'test1', id: 1 });
      const message2 = createTestMessage({ method: 'test2', id: 2 });

      await clientTransport.send(message1);
      await clientTransport.send(message2);

      const history = serverTransport.getClientToServerMessages();
      expect(history).toHaveLength(2);
      expect(history).toContain(message1);
      expect(history).toContain(message2);
    });

    it('should track server-to-client messages', async () => {
      const message1 = createTestMessage({ result: {}, id: 1 });
      const message2 = createTestMessage({ result: {}, id: 2 });

      await serverTransport.send(message1);
      await serverTransport.send(message2);

      const history = clientTransport.getServerToClientMessages();
      expect(history).toHaveLength(2);
      expect(history).toContain(message1);
      expect(history).toContain(message2);
    });

    it('should return copies of message arrays', async () => {
      const message = createTestMessage({ method: 'test' });
      await clientTransport.send(message);

      const history1 = serverTransport.getClientToServerMessages();
      const history2 = serverTransport.getClientToServerMessages();

      // Should be different array instances
      expect(history1).not.toBe(history2);
      // But with same content
      expect(history1).toEqual(history2);
    });
  });
});