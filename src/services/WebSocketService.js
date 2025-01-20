/**
 * WebSocket service for managing real-time connections
 */
export default class WebSocketService {
  constructor() {
    this.ws = null
    this.connected = false
    this.messageBuffer = []
    this.batchTimeout = null
    this.messageCallbacks = new Set()
    this.statusCallbacks = new Set()
    this.presenceCallbacks = new Set()
    this.typingCallbacks = new Set()
    this.readReceiptCallbacks = new Set()
    this.typingUsers = new Map()
    this.readReceipts = new Map()
    this.missedHeartbeats = 0
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0,
      lastReconnectTime: null,
      connectionUptime: 0,
      batchesSent: 0,
      bytesTransferred: 0,
      latencyMeasurements: 0,
      averageLatency: 0
    }
  }

  /**
   * Connect to the WebSocket server
   * @param {string} url WebSocket URL
   * @returns {Promise} Promise that resolves when connection is established
   */
  async connect(url) {
    if (this.ws) {
      this.disconnect()
    }

    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        this.connected = true
        this.statusCallbacks.forEach(cb => cb(true))
        this.sendBufferedMessages()
        this.startHeartbeat()
      }

      this.ws.onclose = () => {
        this.connected = false
        this.statusCallbacks.forEach(cb => cb(false))
        this.stopHeartbeat()
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.metrics.errors++
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.metrics.messagesReceived++
          this.messageCallbacks.forEach(cb => cb(message))
        } catch (error) {
          console.error('Failed to parse message:', error)
          this.metrics.errors++
        }
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 5000)

        this.ws.onopen = () => {
          clearTimeout(timeout)
          resolve()
        }

        this.ws.onerror = (error) => {
          clearTimeout(timeout)
          reject(error)
        }
      })
    } catch (error) {
      console.error('Failed to connect:', error)
      this.metrics.errors++
      throw error
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.connected = false
      this.stopHeartbeat()
    }
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
   */
  send(message) {
    if (!message) return

    const enhancedMessage = {
      ...message,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }

    if (this.connected && this.ws) {
      this.sendImmediate(enhancedMessage)
    } else {
      this.messageBuffer.push(enhancedMessage)
    }
  }

  /**
   * Send a message immediately
   * @param {Object} message Message to send
   */
  sendImmediate(message) {
    try {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected')
      }

      const data = JSON.stringify(message)
      this.ws.send(data)
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
    return { ...this.metrics }
  }

  /**
   * Reset WebSocket metrics
   */
  resetMetrics() {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      reconnections: 0,
      lastReconnectTime: null,
      connectionUptime: 0,
      batchesSent: 0,
      bytesTransferred: 0,
      latencyMeasurements: 0,
      averageLatency: 0
    }
  }
} 