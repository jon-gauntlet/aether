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
    this.messageId = 1
    this.messageCallbacks = new Set()
    this.statusCallbacks = new Set()
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
  }

  /**
   * Connect to the WebSocket server
   * @param {string} url WebSocket URL
   * @param {Object} options Connection options
   */
  connect(url, options = {}) {
    if (this.socket) {
      this.disconnect()
    }

    try {
      this.socket = new WebSocket(url)
      this.setupSocketHandlers()
      this.startHeartbeat()

      if (options.auth) {
        this.authenticate(options.auth)
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.connected = false
      this.socket.close()
      this.socket = null
      this.stopHeartbeat()
      this.clearState()
      this.notifyStatusChange()
    }
  }

  /**
   * Set up WebSocket event handlers
   */
  setupSocketHandlers() {
    this.socket.onopen = () => {
      this.connected = true
      this.notifyStatusChange()
      this.sendBufferedMessages()
    }

    this.socket.onclose = () => {
      this.connected = false
      this.notifyStatusChange()
      this.clearState()
    }

    this.socket.onerror = (error) => {
      this.handleError(error)
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        this.handleError(error)
      }
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
      this.metrics.latencySum += latency
      this.metrics.latencyCount++
    }
  }

  /**
   * Send a message through the WebSocket
   * @param {Object} message Message to send
   */
  send(message) {
    const enhancedMessage = {
      ...message,
      id: this.messageId++,
      timestamp: Date.now()
    }

    if (!this.connected) {
      this.messageBuffer.push(enhancedMessage)
      return
    }

    if (this.shouldBatchMessage(message)) {
      this.queueForBatch(enhancedMessage)
    } else {
      this.sendImmediate(enhancedMessage)
    }
  }

  /**
   * Send a message immediately
   * @param {Object} message Message to send
   */
  sendImmediate(message) {
    try {
      this.socket.send(JSON.stringify(message))
      this.pendingMessages.set(message.id, message)
      this.metrics.messagesSent++
    } catch (error) {
      this.handleError(error)
      this.messageBuffer.push(message)
    }
  }

  /**
   * Check if a message should be batched
   * @param {Object} message Message to check
   * @returns {boolean} True if the message should be batched
   */
  shouldBatchMessage(message) {
    return message.type !== 'presence' && 
           message.type !== 'typing' && 
           message.type !== 'read'
  }

  /**
   * Queue a message for batching
   * @param {Object} message Message to queue
   */
  queueForBatch(message) {
    this.batchQueue.push(message)
    if (this.batchQueue.length >= 10) {
      this.sendBatch()
    } else if (this.batchQueue.length === 1) {
      setTimeout(() => this.sendBatch(), 100)
    }
  }

  /**
   * Send a batch of messages
   */
  sendBatch() {
    if (this.batchQueue.length === 0) return

    const batch = {
      type: 'batch',
      messages: [...this.batchQueue],
      timestamp: Date.now()
    }

    this.sendImmediate(batch)
    this.metrics.batchesSent++
    this.metrics.totalBatchSize += this.batchQueue.length
    this.batchQueue = []
  }

  /**
   * Send buffered messages
   */
  sendBufferedMessages() {
    const messages = [...this.messageBuffer, ...this.batchQueue]
    this.messageBuffer = []
    this.batchQueue = []
    messages.forEach(message => this.send(message))
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
  }

  /**
   * Authenticate with the WebSocket server
   * @param {string} token Authentication token
   */
  authenticate(token) {
    this.send({
      type: 'auth',
      token,
      timestamp: Date.now()
    })
  }

  /**
   * Clear WebSocket state
   */
  clearState() {
    this.batchQueue = []
    this.typingUsers.clear()
    this.readReceipts.clear()
  }

  /**
   * Handle WebSocket error
   * @param {Error} error Error to handle
   */
  handleError(error) {
    this.metrics.errors++
    console.error('WebSocket error:', error)
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
   * Register presence change handler
   * @param {Function} callback Presence change handler callback
   * @returns {Function} Unregister function
   */
  onPresenceChange(callback) {
    this.presenceCallbacks.add(callback)
    return () => this.presenceCallbacks.delete(callback)
  }

  /**
   * Register typing change handler
   * @param {Function} callback Typing change handler callback
   * @returns {Function} Unregister function
   */
  onTypingChange(callback) {
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
   * Notify all message handlers
   * @param {Object} message Message to notify handlers with
   */
  notifyMessageCallbacks(message) {
    this.messageCallbacks.forEach(callback => callback(message))
  }

  /**
   * Notify status change
   */
  notifyStatusChange() {
    this.statusCallbacks.forEach(callback => callback(this.connected))
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
   * Send typing update message
   * @param {boolean} isTyping Typing status
   */
  sendTypingUpdate(isTyping) {
    this.send({
      type: 'typing',
      isTyping,
      timestamp: Date.now()
    })
  }

  /**
   * Mark messages as read
   * @param {Array} messageIds Message IDs to mark as read
   */
  markMessagesAsRead(messageIds) {
    this.send({
      type: 'read',
      messageIds,
      timestamp: Date.now()
    })
  }

  /**
   * Get message read status
   * @param {string} messageId Message ID
   * @returns {Set} Read receipt set for the message
   */
  getMessageReadStatus(messageId) {
    return this.readReceipts.get(messageId) || new Set()
  }

  /**
   * Get WebSocket metrics
   * @returns {Object} WebSocket metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageBatchSize: this.metrics.batchesSent > 0 
        ? this.metrics.totalBatchSize / this.metrics.batchesSent 
        : 0,
      averageLatency: this.metrics.latencyCount > 0
        ? this.metrics.latencySum / this.metrics.latencyCount
        : 0
    }
  }

  /**
   * Reset WebSocket metrics
   */
  resetMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = 0
    })
  }
} 