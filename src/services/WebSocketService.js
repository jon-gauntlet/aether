/**
 * WebSocket service for managing real-time connections
 */
export default class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.disconnectHandlers = new Set();
    this.messageHandlers = new Set();
    this.deliveryHandlers = new Set();
    this.authHandlers = new Set();
    this.messageBuffer = [];
    this.pendingMessages = new Map();
    this.messageIdCounter = 0;
    this.authenticated = false;
    this.authToken = null;
    this.userId = null;
    this.authTimeout = null;
    this.AUTH_TIMEOUT_MS = 5000; // 5 seconds
  }

  /**
   * Connect to the WebSocket server
   * @param {string} [token] Authentication token
   * @returns {Promise} Resolves when connected, rejects on error
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        reject(new Error('Already connected'));
        return;
      }

      // Store token for reconnection
      if (token) {
        this.authToken = token;
      }

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        // Send auth message if token is available
        if (this.authToken) {
          this.sendAuthMessage(this.authToken);
          this.startAuthTimeout();
        }
        this.flushMessageBuffer();
        resolve();
      };

      this.ws.onerror = (error) => {
        this.clearAuthTimeout();
        reject(error);
      };

      this.ws.onclose = () => {
        this.clearAuthTimeout();
        this.ws = null;
        this.authenticated = false;
        this.userId = null;
        this.notifyDisconnectHandlers();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'delivery') {
            this.handleDeliveryConfirmation(message);
          } else if (message.type === 'auth') {
            this.clearAuthTimeout();
            this.handleAuthMessage(message);
          } else {
            this.notifyMessageHandlers(message);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    });
  }

  /**
   * Start authentication timeout
   * @private
   */
  startAuthTimeout() {
    this.clearAuthTimeout();
    this.authTimeout = setTimeout(() => {
      this.handleAuthTimeout();
    }, this.AUTH_TIMEOUT_MS);
  }

  /**
   * Clear authentication timeout
   * @private
   */
  clearAuthTimeout() {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = null;
    }
  }

  /**
   * Handle authentication timeout
   * @private
   */
  handleAuthTimeout() {
    this.authenticated = false;
    this.userId = null;
    this.notifyAuthHandlers({
      status: 'timeout',
      message: 'Authentication timeout'
    });
  }

  /**
   * Send authentication message
   * @private
   */
  sendAuthMessage(token) {
    this.send({
      type: 'auth',
      data: {
        token
      }
    });
  }

  /**
   * Handle authentication message
   * @private
   */
  handleAuthMessage(message) {
    const { status, userId, message: errorMessage } = message.data;
    
    switch (status) {
      case 'success':
        this.authenticated = true;
        this.userId = userId;
        break;
      case 'error':
      case 'expired':
      case 'timeout':
        this.authenticated = false;
        this.userId = null;
        break;
    }

    this.notifyAuthHandlers({
      status,
      userId,
      message: errorMessage
    });
  }

  /**
   * Refresh authentication token
   * @param {string} newToken New authentication token
   */
  refreshToken(newToken) {
    this.authToken = newToken;
    if (this.isConnected()) {
      this.send({
        type: 'auth_refresh',
        data: {
          token: newToken
        }
      });
      this.startAuthTimeout();
    }
  }

  /**
   * Check if authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return this.authenticated;
  }

  /**
   * Register authentication handler
   * @param {Function} handler Handler to call for auth events
   */
  onAuth(handler) {
    this.authHandlers.add(handler);
    return () => this.authHandlers.delete(handler);
  }

  /**
   * Notify all auth handlers
   * @private
   */
  notifyAuthHandlers(authInfo) {
    this.authHandlers.forEach(handler => handler(authInfo));
  }

  /**
   * Disconnect from the WebSocket server
   * @returns {Promise} Resolves when disconnected
   */
  disconnect() {
    return new Promise((resolve) => {
      if (!this.isConnected()) {
        resolve();
        return;
      }

      this.clearAuthTimeout();
      this.ws.onclose = () => {
        this.ws = null;
        this.authenticated = false;
        this.userId = null;
        this.notifyDisconnectHandlers();
        resolve();
      };

      this.ws.close();
    });
  }

  /**
   * Send a message through the WebSocket
   * @param {Object} message Message to send
   */
  send(message) {
    const enhancedMessage = {
      ...message,
      id: ++this.messageIdCounter,
      timestamp: new Date().toISOString()
    };

    if (!this.isConnected()) {
      this.messageBuffer.push(enhancedMessage);
      return;
    }

    this.pendingMessages.set(enhancedMessage.id, {
      message: enhancedMessage,
      timestamp: Date.now()
    });

    this.ws.send(JSON.stringify(enhancedMessage));
  }

  /**
   * Check if connected to WebSocket server
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Register message handler
   * @param {Function} handler Handler to call for messages
   */
  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register disconnect handler
   * @param {Function} handler Handler to call on disconnect
   */
  onDisconnect(handler) {
    this.disconnectHandlers.add(handler);
  }

  /**
   * Register delivery confirmation handler
   * @param {Function} handler Handler to call for delivery confirmations
   */
  onDelivery(handler) {
    this.deliveryHandlers.add(handler);
    return () => this.deliveryHandlers.delete(handler);
  }

  /**
   * Handle delivery confirmation message
   * @private
   */
  handleDeliveryConfirmation(message) {
    const { messageId, status } = message.data;
    const pending = this.pendingMessages.get(messageId);

    if (pending) {
      this.notifyDeliveryHandlers({
        messageId,
        status,
        message: pending.message,
        deliveryTime: Date.now() - pending.timestamp
      });
      this.pendingMessages.delete(messageId);
    }
  }

  /**
   * Send buffered messages
   * @private
   */
  flushMessageBuffer() {
    while (this.messageBuffer.length > 0) {
      const message = this.messageBuffer.shift();
      this.send(message);
    }
  }

  /**
   * Notify all message handlers
   * @private
   */
  notifyMessageHandlers(message) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  /**
   * Notify all disconnect handlers
   * @private
   */
  notifyDisconnectHandlers() {
    this.disconnectHandlers.forEach(handler => handler());
  }

  /**
   * Notify all delivery handlers
   * @private
   */
  notifyDeliveryHandlers(deliveryInfo) {
    this.deliveryHandlers.forEach(handler => handler(deliveryInfo));
  }
} 