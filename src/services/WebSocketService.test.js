import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocketService from './WebSocketService';

describe('WebSocketService', () => {
  let webSocketService;
  const mockUrl = 'ws://localhost:8080';
  const mockToken = 'valid-token-123';

  beforeEach(() => {
    vi.useFakeTimers();
    
    // Mock WebSocket
    global.WebSocket = class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = WebSocket.CONNECTING;
        this.sent = [];
        setTimeout(() => {
          this.readyState = WebSocket.OPEN;
          this.onopen?.();
        }, 0);
      }

      close() {
        this.readyState = WebSocket.CLOSED;
        this.onclose?.();
      }

      send(data) {
        this.sent.push(data);
      }

      simulateMessage(data) {
        this.onmessage?.({ data: JSON.stringify(data) });
      }

      CONNECTING = 0;
      OPEN = 1;
      CLOSING = 2;
      CLOSED = 3;
    };

    webSocketService = new WebSocketService(mockUrl);
  });

  afterEach(() => {
    webSocketService.disconnect();
    vi.useRealTimers();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket server', async () => {
      const connectPromise = webSocketService.connect();
      await expect(connectPromise).resolves.not.toThrow();
      expect(webSocketService.isConnected()).toBe(true);
    });

    it('should disconnect from WebSocket server', async () => {
      await webSocketService.connect();
      const disconnectPromise = webSocketService.disconnect();
      await expect(disconnectPromise).resolves.not.toThrow();
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should handle connection errors', async () => {
      // Mock WebSocket to simulate connection error
      global.WebSocket = class ErrorWebSocket {
        constructor() {
          setTimeout(() => {
            this.onerror?.(new Error('Connection failed'));
            this.onclose?.();
          }, 0);
        }
        close() {}
      };

      const connectPromise = webSocketService.connect();
      await expect(connectPromise).rejects.toThrow('Connection failed');
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should handle unexpected disconnection', async () => {
      const onDisconnect = vi.fn();
      webSocketService.onDisconnect(onDisconnect);

      await webSocketService.connect();
      webSocketService.ws.onclose();

      expect(onDisconnect).toHaveBeenCalled();
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should not allow multiple simultaneous connections', async () => {
      await webSocketService.connect();
      const secondConnectPromise = webSocketService.connect();
      
      await expect(secondConnectPromise).rejects.toThrow('Already connected');
      expect(webSocketService.isConnected()).toBe(true);
    });
  });

  describe('Message System', () => {
    beforeEach(async () => {
      await webSocketService.connect();
    });

    it('should send messages', () => {
      const message = { type: 'test', data: 'Hello' };
      webSocketService.send(message);
      
      const sent = JSON.parse(webSocketService.ws.sent[0]);
      expect(sent).toEqual({
        ...message,
        id: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should receive messages', () => {
      const onMessage = vi.fn();
      webSocketService.onMessage(onMessage);

      const message = { type: 'test', data: 'Hello' };
      webSocketService.ws.simulateMessage(message);

      expect(onMessage).toHaveBeenCalledWith(message);
    });

    it('should buffer messages when disconnected', async () => {
      const message = { type: 'test', data: 'Hello' };
      await webSocketService.disconnect();
      
      webSocketService.send(message);
      expect(webSocketService.messageBuffer).toContainEqual({
        ...message,
        id: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should send buffered messages after reconnection', async () => {
      const message = { type: 'test', data: 'Hello' };
      await webSocketService.disconnect();
      webSocketService.send(message);
      
      await webSocketService.connect();
      const sent = JSON.parse(webSocketService.ws.sent[0]);
      expect(sent).toEqual({
        ...message,
        id: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should handle message delivery confirmation', async () => {
      const onDelivery = vi.fn();
      webSocketService.onDelivery(onDelivery);

      const message = { type: 'test', data: 'Hello' };
      webSocketService.send(message);
      
      const sent = JSON.parse(webSocketService.ws.sent[0]);
      webSocketService.ws.simulateMessage({
        type: 'delivery',
        data: {
          messageId: sent.id,
          status: 'delivered'
        }
      });

      expect(onDelivery).toHaveBeenCalledWith({
        messageId: sent.id,
        status: 'delivered',
        message: expect.any(Object),
        deliveryTime: expect.any(Number)
      });
    });
  });

  describe('Authentication', () => {
    it('should connect with authentication token', async () => {
      await webSocketService.connect(mockToken);
      const authMessage = JSON.parse(webSocketService.ws.sent[0]);
      
      expect(authMessage).toEqual({
        type: 'auth',
        data: {
          token: mockToken
        },
        id: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should handle authentication success', async () => {
      const onAuth = vi.fn();
      webSocketService.onAuth(onAuth);

      await webSocketService.connect(mockToken);
      webSocketService.ws.simulateMessage({
        type: 'auth',
        data: {
          status: 'success',
          userId: '123'
        }
      });

      expect(onAuth).toHaveBeenCalledWith({
        status: 'success',
        userId: '123'
      });
      expect(webSocketService.isAuthenticated()).toBe(true);
    });

    it('should handle authentication failure', async () => {
      const onAuth = vi.fn();
      webSocketService.onAuth(onAuth);

      await webSocketService.connect('invalid-token');
      webSocketService.ws.simulateMessage({
        type: 'auth',
        data: {
          status: 'error',
          message: 'Invalid token'
        }
      });

      expect(onAuth).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid token'
      });
      expect(webSocketService.isAuthenticated()).toBe(false);
    });

    it('should handle token refresh', async () => {
      const newToken = 'new-token-456';
      await webSocketService.connect(mockToken);
      
      webSocketService.refreshToken(newToken);
      const refreshMessage = JSON.parse(webSocketService.ws.sent[1]);
      
      expect(refreshMessage).toEqual({
        type: 'auth_refresh',
        data: {
          token: newToken
        },
        id: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should handle token expiration', async () => {
      const onAuth = vi.fn();
      webSocketService.onAuth(onAuth);

      await webSocketService.connect(mockToken);
      webSocketService.ws.simulateMessage({
        type: 'auth',
        data: {
          status: 'expired',
          message: 'Token expired'
        }
      });

      expect(onAuth).toHaveBeenCalledWith({
        status: 'expired',
        message: 'Token expired'
      });
      expect(webSocketService.isAuthenticated()).toBe(false);
    });

    it('should reconnect with authentication', async () => {
      await webSocketService.connect(mockToken);
      webSocketService.ws.simulateMessage({
        type: 'auth',
        data: {
          status: 'success',
          userId: '123'
        }
      });

      // Simulate disconnect
      webSocketService.ws.onclose();
      expect(webSocketService.isConnected()).toBe(false);

      // Reconnect
      await webSocketService.connect();
      const authMessage = JSON.parse(webSocketService.ws.sent[0]);
      
      expect(authMessage).toEqual({
        type: 'auth',
        data: {
          token: mockToken
        },
        id: expect.any(Number),
        timestamp: expect.any(String)
      });
    });

    it('should clear authentication state on disconnect', async () => {
      await webSocketService.connect(mockToken);
      webSocketService.ws.simulateMessage({
        type: 'auth',
        data: {
          status: 'success',
          userId: '123'
        }
      });

      expect(webSocketService.isAuthenticated()).toBe(true);
      await webSocketService.disconnect();
      expect(webSocketService.isAuthenticated()).toBe(false);
    });

    it('should handle authentication timeout', async () => {
      const onAuth = vi.fn();
      webSocketService.onAuth(onAuth);
      
      await webSocketService.connect(mockToken);
      
      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);
      
      expect(onAuth).toHaveBeenCalledWith({
        status: 'timeout',
        message: 'Authentication timeout'
      });
      expect(webSocketService.isAuthenticated()).toBe(false);
    });
  });
}); 