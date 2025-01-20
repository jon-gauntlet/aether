/**
 * WebSocket service for managing real-time connections
 */
export default class WebSocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.messageBuffer = []
    this.batchQueue = []
    this.pendingMessages = new Map()
    this.messageId = 0
    this.messageCallbacks = new Set()
    this.statusCallbacks = new Set()
    this.disconnectCallbacks = new Set()
    this.presenceCallbacks = new Set()
    this.typingCallbacks = new Set()
    this.readReceiptCallbacks = new Set()
    this.typingUsers = new Map()
    this.readReceipts = new Map()
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0,
      batchesSent: 0,
      totalBatchSize: 0,
      latencySum: 0,
      latencyCount: 0
    }
    this.connectionStartTime = null
    this.heartbeatInterval = null
    this.batchTimeout = null
  }

  /**
   * Check if WebSocket is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected && this.socket?.readyState === WebSocket.OPEN
  }

  /**
   * Connect to the WebSocket server
   * @param {string} url WebSocket URL
   * @param {Object} options Connection options
   * @returns {Promise} Connection promise
   */
  connect(url, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const timeout = options.timeout || 5000;
        const timeoutId = setTimeout(() => {
          if (!this.connected) {
            this.handleError(new Error('Connection timeout'));
            reject(new Error('Connection timeout'));
          }
        }, timeout);

        this.socket = new WebSocket(url);
        this.setupSocketHandlers();

        const onOpen = () => {
          clearTimeout(timeoutId);
          this.connected = true;
          this.connectionStartTime = Date.now();
          this.startHeartbeat();
          this.notifyStatusChange();
          resolve();
        };

        const onError = (error) => {
          clearTimeout(timeoutId);
          this.handleError(error);
          reject(error);
        };

        this.socket.addEventListener('open', onOpen);
        this.socket.addEventListener('error', onError);

        // Cleanup listeners after connection attempt
        const cleanup = () => {
          this.socket.removeEventListener('open', onOpen);
          this.socket.removeEventListener('error', onError);
        };

        this.socket.addEventListener('open', cleanup, { once: true });
        this.socket.addEventListener('error', cleanup, { once: true });

        if (options.auth) {
          this.authenticate(options.auth)
        }
      } catch (error) {
        this.handleError(error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   * @returns {Promise} Disconnection promise
   */
  disconnect() {
    return new Promise((resolve) => {
      if (this.socket) {
        this.connected = false
        this.socket.close()
        this.socket = null
        this.stopHeartbeat()
        this.clearState()
        this.notifyStatusChange()
        this.notifyDisconnect()
      }
      resolve()
    })
  }

  /**
   * Reconnect to the WebSocket server
   */
  reconnect() {
    this.metrics.reconnections++
    this.metrics.lastReconnectTime = Date.now()
    setTimeout(() => {
      if (!this.connected) {
        this.connect()
      }
    }, Math.min(1000 * Math.pow(2, this.metrics.reconnections), 30000))
  }

  /**
   * Send a message through the WebSocket
   * @param {Object} message Message to send
   * @returns {Promise} Message sending promise
   */
  send(message) {
    return new Promise((resolve, reject) => {
      try {
        const enhancedMessage = {
          ...message,
          id: this.messageId++,
          timestamp: Date.now()
        }

        if (!this.isConnected()) {
          this.messageBuffer.push(enhancedMessage)
          resolve(enhancedMessage)
          return
        }

        if (this.shouldBatchMessage(message)) {
          this.queueForBatch(enhancedMessage)
          resolve(enhancedMessage)
        } else {
          this.sendImmediate(enhancedMessage)
            .then(() => resolve(enhancedMessage))
            .catch(reject)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Send a message immediately
   * @param {Object} message Message to send
   */
  sendImmediate(message) {
    try {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected')
      }

      const data = JSON.stringify(message)
      this.socket.send(data)
      this.metrics.messagesSent++
      this.metrics.bytesTransferred += data.length
    } catch (error) {
      console.error('Failed to send message:', error)
      this.metrics.errors++
      this.messageBuffer.push(message)
    }
  }

  /**
   * Send buffered messages
   */
  sendBufferedMessages() {
    while (this.messageBuffer.length > 0 && this.connected) {
      const message = this.messageBuffer.shift()
      this.sendImmediate(message)
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} message Incoming message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'batch':
        message.messages.forEach(msg => this.handleMessage(msg))
        break
      case 'delivery':
        this.handleDeliveryConfirmation(message)
        break
      case 'presence':
        this.handlePresenceUpdate(message)
        break
      case 'typing':
        this.handleTypingUpdate(message)
        break
      case 'read':
        this.handleReadReceipt(message)
        break
      default:
        this.notifyMessageCallbacks(message)
    }

    this.metrics.messagesReceived++
    if (message.timestamp) {
      const latency = Date.now() - message.timestamp
      this.metrics.latencyMeasurements++
      this.metrics.averageLatency = ((this.metrics.averageLatency * (this.metrics.latencyMeasurements - 1)) + latency) / this.metrics.latencyMeasurements
    }
  }

  /**
   * Handle delivery confirmation message
   * @param {Object} message Delivery confirmation message
   */
  handleDeliveryConfirmation(message) {
    const { messageId } = message
    if (this.pendingMessages.has(messageId)) {
      this.pendingMessages.delete(messageId)
      this.notifyMessageCallbacks({
        type: 'delivery',
        messageId,
        status: 'delivered'
      })
    }
  }

  /**
   * Handle presence update message
   * @param {Object} message Presence update message
   */
  handlePresenceUpdate(message) {
    this.presenceCallbacks.forEach(callback => callback(message))
  }

  /**
   * Handle typing update message
   * @param {Object} message Typing update message
   */
  handleTypingUpdate(message) {
    const { userId, isTyping } = message
    if (isTyping) {
      this.typingUsers.set(userId, Date.now())
    } else {
      this.typingUsers.delete(userId)
    }
    this.notifyTypingCallbacks()
  }

  /**
   * Handle read receipt message
   * @param {Object} message Read receipt message
   */
  handleReadReceipt(message) {
    const { userId, messageIds } = message
    messageIds.forEach(messageId => {
      if (!this.readReceipts.has(messageId)) {
        this.readReceipts.set(messageId, new Set())
      }
      this.readReceipts.get(messageId).add(userId)
    })
    this.notifyReadReceiptCallbacks(message)
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.send({ type: 'ping', timestamp: Date.now() })
        this.missedHeartbeats++
        
        if (this.missedHeartbeats >= 2) {
          this.disconnect()
          this.reconnect()
        }
      }
    }, 30000)
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    this.missedHeartbeats = 0
  }

  /**
   * Register message handler
   * @param {Function} callback Message handler callback
   * @returns {Function} Unregister function
   */
  onMessage(callback) {
    this.messageCallbacks.add(callback)
    return () => this.messageCallbacks.delete(callback)
  }

  /**
   * Register status change handler
   * @param {Function} callback Status change handler callback
   * @returns {Function} Unregister function
   */
  onStatusChange(callback) {
    this.statusCallbacks.add(callback)
    return () => this.statusCallbacks.delete(callback)
  }

  /**
   * Register disconnect handler
   * @param {Function} callback Disconnect handler callback
   * @returns {Function} Unregister function
   */
  onDisconnect(callback) {
    this.disconnectCallbacks.add(callback)
    return () => this.disconnectCallbacks.delete(callback)
  }

  /**
   * Register presence handler
   * @param {Function} callback Presence handler callback
   * @returns {Function} Unregister function
   */
  onPresence(callback) {
    this.presenceCallbacks.add(callback)
    return () => this.presenceCallbacks.delete(callback)
  }

  /**
   * Register typing handler
   * @param {Function} callback Typing handler callback
   * @returns {Function} Unregister function
   */
  onTyping(callback) {
    this.typingCallbacks.add(callback)
    return () => this.typingCallbacks.delete(callback)
  }

  /**
   * Register read receipt handler
   * @param {Function} callback Read receipt handler callback
   * @returns {Function} Unregister function
   */
  onReadReceipt(callback) {
    this.readReceiptCallbacks.add(callback)
    return () => this.readReceiptCallbacks.delete(callback)
  }

  /**
   * Notify status change
   */
  notifyStatusChange() {
    this.statusCallbacks.forEach(callback => callback(this.isConnected()))
  }

  /**
   * Notify disconnect
   */
  notifyDisconnect() {
    this.disconnectCallbacks.forEach(callback => callback())
  }

  /**
   * Notify message callbacks
   * @param {Object} message Message to notify
   */
  notifyMessageCallbacks(message) {
    this.messageCallbacks.forEach(callback => callback(message))
  }

  /**
   * Set up WebSocket event handlers
   */
  setupSocketHandlers() {
    if (!this.socket) return

    this.socket.addEventListener('open', () => {
      this.connected = true
      this.connectionStartTime = Date.now()
      this.notifyStatusChange()
      this.sendBufferedMessages()
    })

    this.socket.addEventListener('close', () => {
      this.connected = false
      this.notifyStatusChange()
      this.clearState()
      this.notifyDisconnect()
    })

    this.socket.addEventListener('error', (error) => {
      this.handleError(error)
    })

    this.socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        this.handleError(error)
      }
    })
  }

  /**
   * Handle incoming WebSocket messages
   * @param {Object} message Incoming message
   */
  handleMessage(message) {
    try {
      switch (message.type) {
        case 'batch':
          if (Array.isArray(message.messages)) {
            message.messages.forEach(msg => this.handleMessage(msg))
          }
          break
        case 'delivery':
          if (message.data?.messageId) {
            this.handleDeliveryConfirmation(message.data)
          }
          break
        case 'presence':
          this.handlePresenceUpdate(message.data || message)
          break
        case 'typing':
          if (message.data?.userId !== undefined) {
            this.handleTypingUpdate(message.data)
          }
          break
        case 'read':
          if (message.data?.messageIds) {
            this.handleReadReceipt(message.data)
          }
          break
        default:
          this.notifyMessageCallbacks(message)
      }

      this.metrics.messagesReceived++
      if (message.timestamp) {
        const latency = Date.now() - message.timestamp
        this.metrics.latencySum += latency
        this.metrics.latencyCount++
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Queue a message for batch sending
   * @param {Object} message Message to queue
   */
  queueForBatch(message) {
    this.batchQueue.push(message)
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.sendBatch(), 100)
    }
  }

  /**
   * Send queued messages as a batch
   */
  sendBatch() {
    if (this.batchQueue.length === 0) return

    const batch = {
      type: 'batch',
      messages: this.batchQueue.splice(0, 10),
      timestamp: Date.now()
    }

    this.sendImmediate(batch)
      .then(() => {
        this.metrics.batchesSent++
        this.metrics.totalBatchSize += batch.messages.length
      })
      .catch(this.handleError.bind(this))

    if (this.batchQueue.length > 0) {
      this.batchTimeout = setTimeout(() => this.sendBatch(), 100)
    } else {
      this.batchTimeout = null
    }
  }

  /**
   * Handle error
   * @param {Error} error Error to handle
   */
  handleError(error) {
    this.metrics.errors++
    console.error('WebSocket error:', error)
  }

  /**
   * Clear state
   */
  clearState() {
    this.typingUsers.clear()
    this.readReceipts.clear()
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }

  /**
   * Notify typing change
   */
  notifyTypingCallbacks() {
    const typingList = Array.from(this.typingUsers.entries())
      .filter(([_, timestamp]) => Date.now() - timestamp < 5000)
      .map(([userId]) => userId)
    
    this.typingCallbacks.forEach(callback => callback(typingList))
  }

  /**
   * Notify read receipt change
   * @param {Object} message Read receipt message
   */
  notifyReadReceiptCallbacks(message) {
    this.readReceiptCallbacks.forEach(callback => callback(message))
  }

  /**
   * Check if message should be batched
   * @param {Object} message Message to check
   * @returns {boolean} Whether message should be batched
   */
  shouldBatchMessage(message) {
    return !['ping', 'pong', 'batch'].includes(message.type)
  }

  /**
   * Get metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageLatency: this.metrics.latencyCount > 0
        ? this.metrics.latencySum / this.metrics.latencyCount
        : 0,
      averageBatchSize: this.metrics.batchesSent > 0
        ? this.metrics.totalBatchSize / this.metrics.batchesSent
        : 0,
      uptime: this.connectionStartTime
        ? Date.now() - this.connectionStartTime
        : 0
    }
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0,
      batchesSent: 0,
      totalBatchSize: 0,
      latencySum: 0,
      latencyCount: 0
    }
  }
} 