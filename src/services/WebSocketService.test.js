import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocketService from './WebSocketService';

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.eventHandlers = new Map();
    this.sent = [];
  }

  addEventListener(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  removeEventListener(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  send(data) {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sent.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.triggerEvent('close');
  }

  triggerEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        if (event === 'message') {
          handler({ data: JSON.stringify(data) });
        } else if (event === 'error') {
          handler(data);
        } else {
          handler();
        }
      });
    }
  }

  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    this.triggerEvent('open');
  }

  simulateMessage(data) {
    this.triggerEvent('message', data);
  }

  simulateError(error) {
    this.triggerEvent('error', error);
  }

  simulateClose() {
    this.readyState = WebSocket.CLOSED;
    this.triggerEvent('close');
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket;
global.WebSocket.CONNECTING = 0;
global.WebSocket.OPEN = 1;
global.WebSocket.CLOSING = 2;
global.WebSocket.CLOSED = 3;

describe('WebSocketService', () => {
  let webSocketService;
  const mockUrl = 'ws://localhost:8080';

  beforeEach(() => {
    vi.useFakeTimers();
    webSocketService = new WebSocketService();
  });

  afterEach(() => {
    webSocketService.disconnect();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      const connectPromise = webSocketService.connect(mockUrl);
      webSocketService.socket.simulateOpen();
      await expect(connectPromise).resolves.not.toThrow();
      expect(webSocketService.isConnected()).toBe(true);
    });

    it('should disconnect from WebSocket server', async () => {
      await webSocketService.connect(mockUrl);
      webSocketService.socket.simulateOpen();
      const disconnectPromise = webSocketService.disconnect();
      await expect(disconnectPromise).resolves.not.toThrow();
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should handle connection errors', async () => {
      const connectPromise = webSocketService.connect(mockUrl);
      webSocketService.socket.simulateError(new Error('Connection failed'));
      await expect(connectPromise).rejects.toThrow('Connection failed');
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should handle unexpected disconnection', async () => {
      const onDisconnect = vi.fn();
      webSocketService.onDisconnect(onDisconnect);

      await webSocketService.connect(mockUrl);
      webSocketService.socket.simulateOpen();
      webSocketService.socket.simulateClose();

      expect(onDisconnect).toHaveBeenCalled();
      expect(webSocketService.isConnected()).toBe(false);
    });
  });

  describe('Message System', () => {
    beforeEach(async () => {
      await webSocketService.connect(mockUrl);
      webSocketService.socket.simulateOpen();
    });

    it('should send messages', async () => {
      const message = { type: 'test', data: 'Hello' };
      await webSocketService.send(message);
      
      const sent = JSON.parse(webSocketService.socket.sent[0]);
      expect(sent).toEqual({
        ...message,
        id: expect.any(Number),
        timestamp: expect.any(Number)
      });
    });

    it('should receive messages', () => {
      const onMessage = vi.fn();
      webSocketService.onMessage(onMessage);

      const message = { type: 'test', data: 'Hello' };
      webSocketService.socket.simulateMessage(message);

      expect(onMessage).toHaveBeenCalledWith(message);
    });

    it('should buffer messages when disconnected', async () => {
      const message = { type: 'test', data: 'Hello' };
      await webSocketService.disconnect();
      
      await webSocketService.send(message);
      expect(webSocketService.messageBuffer).toContainEqual({
        ...message,
        id: expect.any(Number),
        timestamp: expect.any(Number)
      });
    });

    it('should send buffered messages after reconnection', async () => {
      const message = { type: 'test', data: 'Hello' };
      await webSocketService.disconnect();
      await webSocketService.send(message);
      
      await webSocketService.connect(mockUrl);
      webSocketService.socket.simulateOpen();
      
      const sent = JSON.parse(webSocketService.socket.sent[0]);
      expect(sent).toEqual({
        ...message,
        id: expect.any(Number),
        timestamp: expect.any(Number)
      });
    });

    it('should handle message delivery confirmation', async () => {
      const message = { type: 'test', data: 'Hello' };
      await webSocketService.send(message);
      
      const sent = JSON.parse(webSocketService.socket.sent[0]);
      webSocketService.socket.simulateMessage({
        type: 'delivery',
        data: {
          messageId: sent.id,
          status: 'delivered'
        }
      });

      // Verify the message was removed from pending messages
      expect(webSocketService.pendingMessages.has(sent.id)).toBe(false);
    });
  });
}); 