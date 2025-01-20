import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import WebSocketService from '../WebSocketService'

describe('WebSocketService', () => {
  let webSocketService
  let mockWebSocket
  let sentMessages = []
  let eventHandlers = {}

  beforeEach(() => {
    vi.useFakeTimers()
    sentMessages = []
    eventHandlers = {}
    mockWebSocket = {
      send: vi.fn((data) => sentMessages.push(JSON.parse(data))),
      close: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = []
        }
        eventHandlers[event].push(handler)
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (eventHandlers[event]) {
          eventHandlers[event] = eventHandlers[event].filter(h => h !== handler)
        }
      }),
      readyState: WebSocket.OPEN
    }
    global.WebSocket = vi.fn(() => mockWebSocket)
    global.WebSocket.OPEN = 1
    global.WebSocket.CLOSED = 3
    webSocketService = new WebSocketService()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  // Helper to trigger WebSocket events
  const triggerWebSocketEvent = (eventName, data) => {
    if (eventHandlers[eventName]) {
      eventHandlers[eventName].forEach(handler => handler(data))
    }
  }

  it('should initialize with disconnected state', () => {
    expect(webSocketService.isConnected()).toBe(false)
  })

  it('should connect to WebSocket server', async () => {
    const url = 'ws://localhost:8000'
    const connectPromise = webSocketService.connect(url)
    triggerWebSocketEvent('open', {})
    await connectPromise
    expect(global.WebSocket).toHaveBeenCalledWith(url)
    expect(webSocketService.isConnected()).toBe(true)
  })

  it('should handle connection status changes', async () => {
    const onStatusChange = vi.fn()
    webSocketService.onStatusChange(onStatusChange)
    
    const url = 'ws://localhost:8000'
    await webSocketService.connect(url)
    triggerWebSocketEvent('open', {})
    
    expect(onStatusChange).toHaveBeenCalledWith(true)
    expect(webSocketService.isConnected()).toBe(true)
  })

  it('should send messages', async () => {
    const url = 'ws://localhost:8000'
    await webSocketService.connect(url)
    triggerWebSocketEvent('open', {})

    const message = { type: 'test', data: 'hello' }
    await webSocketService.send(message)
    
    expect(sentMessages[0]).toMatchObject({
      type: 'test',
      data: 'hello',
      id: expect.any(Number),
      timestamp: expect.any(Number)
    })
  })

  it('should handle message reception', async () => {
    const onMessage = vi.fn()
    webSocketService.onMessage(onMessage)
    
    const url = 'ws://localhost:8000'
    await webSocketService.connect(url)
    triggerWebSocketEvent('open', {})
    
    const testMessage = { type: 'test', data: 'received' }
    triggerWebSocketEvent('message', { data: JSON.stringify(testMessage) })
    
    expect(onMessage).toHaveBeenCalledWith(testMessage)
  })

  it('should handle reconnection on disconnect', async () => {
    const url = 'ws://localhost:8000'
    await webSocketService.connect(url)
    triggerWebSocketEvent('open', {})
    
    triggerWebSocketEvent('close', {})
    
    expect(webSocketService.isConnected()).toBe(false)
  })

  describe('Presence Tracking', () => {
    it('should send presence update on connection', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      expect(sentMessages).toContainEqual({
        type: 'presence',
        data: {
          status: 'online',
          timestamp: expect.any(Number)
        }
      })
    })

    it('should handle presence updates from other users', async () => {
      const onPresence = vi.fn()
      webSocketService.onPresence(onPresence)
      
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      const presenceUpdate = {
        type: 'presence',
        data: {
          userId: 'user123',
          status: 'online',
          timestamp: Date.now()
        }
      }
      
      triggerWebSocketEvent('message', { data: JSON.stringify(presenceUpdate) })
      expect(onPresence).toHaveBeenCalledWith(presenceUpdate.data)
    })

    it('should send offline status when disconnecting', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      await webSocketService.disconnect()
      
      expect(sentMessages).toContainEqual({
        type: 'presence',
        data: {
          status: 'offline',
          timestamp: expect.any(Number)
        }
      })
    })
  })

  describe('Typing Indicators', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should send typing start update', () => {
      webSocketService.sendTypingUpdate(true)
      
      expect(sentMessages).toContainEqual({
        type: 'typing',
        data: {
          isTyping: true,
          timestamp: expect.any(String)
        }
      })
    })

    it('should send typing stop update', () => {
      webSocketService.sendTypingUpdate(false)
      
      expect(sentMessages).toContainEqual({
        type: 'typing',
        data: {
          isTyping: false,
          timestamp: expect.any(String)
        }
      })
    })

    it('should automatically clear typing status after timeout', () => {
      webSocketService.sendTypingUpdate(true)
      sentMessages = [] // Clear initial typing message
      
      vi.advanceTimersByTime(3000)
      
      expect(sentMessages).toContainEqual({
        type: 'typing',
        data: {
          isTyping: false,
          timestamp: expect.any(String)
        }
      })
    })

    it('should handle typing updates from other users', () => {
      const onTypingChange = vi.fn()
      webSocketService.onTypingChange(onTypingChange)
      
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // User starts typing
      messageCallback({
        data: JSON.stringify({
          type: 'typing',
          data: {
            userId: 'user1',
            isTyping: true,
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      expect(onTypingChange).toHaveBeenCalledWith(['user1'])
      
      // User stops typing
      messageCallback({
        data: JSON.stringify({
          type: 'typing',
          data: {
            userId: 'user1',
            isTyping: false,
            timestamp: '2024-03-21T12:01:00.000Z'
          }
        })
      })
      
      expect(onTypingChange).toHaveBeenCalledWith([])
    })

    it('should clear typing status on disconnect', () => {
      const onTypingChange = vi.fn()
      webSocketService.onTypingChange(onTypingChange)
      
      // Add a typing user
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      messageCallback({
        data: JSON.stringify({
          type: 'typing',
          data: {
            userId: 'user1',
            isTyping: true,
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      // Simulate disconnect
      const closeCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )[1]
      closeCallback()
      
      expect(webSocketService.getTypingUsers()).toHaveLength(0)
      expect(onTypingChange).toHaveBeenLastCalledWith([])
    })

    it('should handle multiple typing users', () => {
      const onTypingChange = vi.fn()
      webSocketService.onTypingChange(onTypingChange)
      
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // First user starts typing
      messageCallback({
        data: JSON.stringify({
          type: 'typing',
          data: {
            userId: 'user1',
            isTyping: true,
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      // Second user starts typing
      messageCallback({
        data: JSON.stringify({
          type: 'typing',
          data: {
            userId: 'user2',
            isTyping: true,
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      expect(onTypingChange).toHaveBeenCalledWith(['user1', 'user2'])
    })
  })

  describe('Message Delivery', () => {
    it('should add message ID and track pending messages', () => {
      const message = { type: 'test', data: 'hello' }
      webSocketService.send(message)
      
      expect(sentMessages[0]).toHaveProperty('id')
      expect(sentMessages[0].id).toBe(1)
      expect(webSocketService.pendingMessages.has(1)).toBe(true)
    })

    it('should handle delivery confirmation', () => {
      const onDelivery = vi.fn()
      webSocketService.onDelivery(onDelivery)
      
      // Send a message first
      const message = { type: 'test', data: 'hello' }
      webSocketService.send(message)
      const sentMessageId = sentMessages[0].id
      
      // Simulate delivery confirmation
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      messageCallback({
        data: JSON.stringify({
          type: 'delivery',
          data: {
            messageId: sentMessageId,
            status: 'delivered',
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      expect(onDelivery).toHaveBeenCalledWith(expect.objectContaining({
        messageId: sentMessageId,
        status: 'delivered',
        deliveryTime: expect.any(Number)
      }))
      
      expect(webSocketService.pendingMessages.has(sentMessageId)).toBe(false)
    })

    it('should send delivery confirmation for received messages', () => {
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      messageCallback({
        data: JSON.stringify({
          type: 'message',
          id: 123,
          data: 'test message'
        })
      })
      
      expect(sentMessages).toContainEqual({
        type: 'delivery',
        data: {
          messageId: 123,
          status: 'delivered',
          timestamp: expect.any(String)
        }
      })
    })
  })

  describe('Message Buffering', () => {
    it('should buffer messages when disconnected', async () => {
      const message = { type: 'test', data: 'buffered' }
      await webSocketService.send(message)
      
      expect(webSocketService.messageBuffer).toHaveLength(1)
      expect(webSocketService.messageBuffer[0]).toMatchObject({
        type: 'test',
        data: 'buffered'
      })
    })

    it('should send buffered messages after connection', async () => {
      const message = { type: 'test', data: 'buffered' }
      await webSocketService.send(message)
      
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      expect(webSocketService.messageBuffer).toHaveLength(0)
      expect(sentMessages).toContainEqual(expect.objectContaining({
        type: 'test',
        data: 'buffered'
      }))
    })

    it('should preserve message order in buffer', async () => {
      const messages = [
        { type: 'test', data: 'first' },
        { type: 'test', data: 'second' },
        { type: 'test', data: 'third' }
      ]
      
      for (const message of messages) {
        await webSocketService.send(message)
      }
      
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      expect(sentMessages.map(m => m.data)).toEqual(['first', 'second', 'third'])
    })
  })

  describe('Read Receipts', () => {
    it('should track unread messages', () => {
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      messageCallback({
        data: JSON.stringify({
          type: 'message',
          id: 123,
          data: 'test message'
        })
      })
      
      expect(webSocketService.unreadMessages.has(123)).toBe(true)
    })

    it('should handle read receipts', () => {
      const onReadReceipt = vi.fn()
      webSocketService.onReadReceipt(onReadReceipt)
      
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // Add unread message
      messageCallback({
        data: JSON.stringify({
          type: 'message',
          id: 123,
          data: 'test message'
        })
      })
      
      // Simulate read receipt
      messageCallback({
        data: JSON.stringify({
          type: 'read',
          data: {
            userId: 'user1',
            messageIds: [123],
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      expect(webSocketService.unreadMessages.has(123)).toBe(false)
      expect(webSocketService.readMessages.get('user1').has(123)).toBe(true)
      expect(onReadReceipt).toHaveBeenCalledWith(expect.objectContaining({
        readMessages: expect.arrayContaining([
          ['user1', expect.any(Set)]
        ]),
        unreadMessages: expect.any(Array)
      }))
    })

    it('should send read receipts', () => {
      webSocketService.markMessagesAsRead([123, 456])
      
      expect(sentMessages).toContainEqual({
        type: 'read',
        data: {
          messageIds: [123, 456],
          timestamp: expect.any(String)
        }
      })
    })

    it('should get message read status', () => {
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // Add message and mark as read by two users
      messageCallback({
        data: JSON.stringify({
          type: 'message',
          id: 123,
          data: 'test message'
        })
      })
      
      messageCallback({
        data: JSON.stringify({
          type: 'read',
          data: {
            userId: 'user1',
            messageIds: [123],
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      messageCallback({
        data: JSON.stringify({
          type: 'read',
          data: {
            userId: 'user2',
            messageIds: [123],
            timestamp: '2024-03-21T12:01:00.000Z'
          }
        })
      })
      
      const status = webSocketService.getMessageReadStatus(123)
      expect(status).toEqual({
        isRead: true,
        readBy: expect.arrayContaining(['user1', 'user2']),
        isUnread: false
      })
    })

    it('should handle multiple messages in read receipt', () => {
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // Add multiple unread messages
      [123, 456, 789].forEach(id => {
        messageCallback({
          data: JSON.stringify({
            type: 'message',
            id,
            data: `message ${id}`
          })
        })
      })
      
      // Mark multiple messages as read
      messageCallback({
        data: JSON.stringify({
          type: 'read',
          data: {
            userId: 'user1',
            messageIds: [123, 456, 789],
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      expect(webSocketService.unreadMessages.size).toBe(0)
      const userReadMessages = webSocketService.readMessages.get('user1')
      expect(userReadMessages.size).toBe(3)
      expect(userReadMessages.has(123)).toBe(true)
      expect(userReadMessages.has(456)).toBe(true)
      expect(userReadMessages.has(789)).toBe(true)
    })

    it('should clear read state on disconnect', () => {
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // Add message and mark as read
      messageCallback({
        data: JSON.stringify({
          type: 'message',
          id: 123,
          data: 'test message'
        })
      })
      
      messageCallback({
        data: JSON.stringify({
          type: 'read',
          data: {
            userId: 'user1',
            messageIds: [123],
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      webSocketService.disconnect()
      
      expect(webSocketService.readMessages.size).toBe(0)
      expect(webSocketService.unreadMessages.size).toBe(0)
    })

    it('should only send read receipts for unread messages', () => {
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // Add message and mark as read
      messageCallback({
        data: JSON.stringify({
          type: 'message',
          id: 123,
          data: 'test message'
        })
      })
      
      messageCallback({
        data: JSON.stringify({
          type: 'read',
          data: {
            userId: 'user1',
            messageIds: [123],
            timestamp: '2024-03-21T12:00:00.000Z'
          }
        })
      })
      
      // Clear sent messages
      sentMessages = []
      
      // Try to mark as read again
      webSocketService.markMessagesAsRead([123])
      
      // Should not send read receipt for already read message
      expect(sentMessages).not.toContainEqual(expect.objectContaining({
        type: 'read',
        data: expect.objectContaining({
          messageIds: [123]
        })
      }))
    })
  })

  describe('Heartbeat System', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should start heartbeat on connection', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Simulate connection open
      const openCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1]
      openCallback()
      
      // Clear initial messages
      sentMessages = []
      
      // Advance timer to trigger heartbeat
      vi.advanceTimersByTime(30000)
      
      expect(sentMessages).toContainEqual({
        type: 'ping',
        timestamp: expect.any(String)
      })
    })

    it('should handle pong responses', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      // Simulate pong message
      messageCallback({
        data: JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        })
      })
      
      expect(webSocketService.missedHeartbeats).toBe(0)
    })

    it('should close connection after missed heartbeats', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Simulate connection open
      const openCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1]
      openCallback()
      
      // Advance timer to trigger heartbeat and timeout
      vi.advanceTimersByTime(30000) // First heartbeat
      vi.advanceTimersByTime(5000) // First timeout
      vi.advanceTimersByTime(30000) // Second heartbeat
      vi.advanceTimersByTime(5000) // Second timeout
      
      expect(mockWebSocket.close).toHaveBeenCalled()
    })

    it('should stop heartbeat on disconnect', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Simulate connection open
      const openCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1]
      openCallback()
      
      webSocketService.disconnect()
      
      // Clear messages
      sentMessages = []
      
      // Advance timer
      vi.advanceTimersByTime(30000)
      
      expect(sentMessages).not.toContainEqual(expect.objectContaining({
        type: 'ping'
      }))
    })
  })

  describe('Connection Recovery', () => {
    it('should save connection state on disconnect', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Send some messages
      const messages = [
        { type: 'test', data: 'message 1' },
        { type: 'test', data: 'message 2' }
      ]
      
      messages.forEach(msg => webSocketService.send(msg))
      
      // Simulate disconnect
      webSocketService.disconnect()
      
      expect(webSocketService.connectionState.lastMessageId).toBe(2)
      expect(webSocketService.connectionState.lastEventTimestamp).toBeTruthy()
    })

    it('should attempt state recovery on reconnection', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Set some state
      webSocketService.connectionState.lastMessageId = 5
      webSocketService.connectionState.lastEventTimestamp = new Date().toISOString()
      webSocketService.connectionState.missedEvents.add(4)
      webSocketService.connectionState.missedEvents.add(5)
      
      // Simulate connection open
      const openCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1]
      openCallback()
      
      expect(sentMessages).toContainEqual({
        type: 'recovery',
        data: {
          lastMessageId: 5,
          lastEventTimestamp: expect.any(String),
          missedEvents: [4, 5]
        }
      })
    })

    it('should track missed events during disconnection', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Send message and simulate pending delivery
      const message = { type: 'test', data: 'hello' }
      webSocketService.send(message)
      const messageId = sentMessages[0].id
      
      // Simulate disconnect
      webSocketService.disconnect()
      
      expect(webSocketService.connectionState.missedEvents.has(messageId)).toBe(true)
    })

    it('should clear recovery state after successful recovery', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Set some state
      webSocketService.connectionState.lastMessageId = 5
      webSocketService.connectionState.lastEventTimestamp = new Date().toISOString()
      webSocketService.connectionState.missedEvents.add(4)
      webSocketService.connectionState.missedEvents.add(5)
      
      // Simulate connection open and recovery
      const openCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1]
      openCallback()
      
      expect(webSocketService.connectionState.missedEvents.size).toBe(0)
      expect(webSocketService.connectionState.recoveryInProgress).toBe(false)
    })

    it('should update connection state with new messages', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      const testMessage = {
        type: 'message',
        id: 123,
        timestamp: new Date().toISOString(),
        data: 'test'
      }
      
      messageCallback({
        data: JSON.stringify(testMessage)
      })
      
      expect(webSocketService.connectionState.lastMessageId).toBe(123)
      expect(webSocketService.connectionState.lastEventTimestamp).toBe(testMessage.timestamp)
    })

    it('should handle recovery message sending failure', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      
      // Set some state
      webSocketService.connectionState.lastMessageId = 5
      webSocketService.connectionState.lastEventTimestamp = new Date().toISOString()
      webSocketService.connectionState.missedEvents.add(4)
      
      // Mock socket.send to throw error
      mockWebSocket.send.mockImplementationOnce(() => {
        throw new Error('Send failed')
      })
      
      // Simulate connection open
      const openCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1]
      openCallback()
      
      expect(webSocketService.connectionState.recoveryInProgress).toBe(false)
      expect(webSocketService.connectionState.missedEvents.size).toBe(0)
    })
  })

  describe('Message Batching', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should queue messages for batching', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      const message = { type: 'test', data: 'batch me' }
      await webSocketService.send(message)
      
      expect(webSocketService.batchQueue).toHaveLength(1)
      expect(webSocketService.batchQueue[0]).toMatchObject({
        type: 'test',
        data: 'batch me'
      })
    })

    it('should send batch after delay', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      const messages = [
        { type: 'test', data: 'message 1' },
        { type: 'test', data: 'message 2' }
      ]
      
      for (const message of messages) {
        await webSocketService.send(message)
      }
      
      vi.advanceTimersByTime(100)
      
      expect(webSocketService.batchQueue).toHaveLength(0)
      expect(sentMessages).toContainEqual(expect.objectContaining({
        type: 'batch',
        messages: expect.arrayContaining([
          expect.objectContaining({ data: 'message 1' }),
          expect.objectContaining({ data: 'message 2' })
        ])
      }))
    })

    it('should respect batch size limit', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      const messages = Array.from({ length: 15 }, (_, i) => ({
        type: 'test',
        data: `message ${i + 1}`
      }))
      
      for (const message of messages) {
        await webSocketService.send(message)
      }
      
      vi.advanceTimersByTime(100)
      
      expect(sentMessages[0].messages).toHaveLength(10)
      expect(webSocketService.batchQueue).toHaveLength(5)
    })

    it('should handle batch message reception', () => {
      const onMessage = vi.fn()
      webSocketService.onMessage(onMessage)
      
      const messageCallback = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )[1]
      
      const batchMessage = {
        type: 'batch',
        messages: [
          { type: 'test', data: 'message 1', queueTime: Date.now() - 100 },
          { type: 'test', data: 'message 2', queueTime: Date.now() - 50 }
        ]
      }
      
      messageCallback({
        data: JSON.stringify(batchMessage)
      })
      
      expect(onMessage).toHaveBeenCalledTimes(2)
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({ data: 'message 1' })
      )
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({ data: 'message 2' })
      )
    })

    it('should move batch queue to buffer on disconnect', () => {
      const messages = [
        { type: 'test', data: 'message 1' },
        { type: 'test', data: 'message 2' }
      ]

      webSocketService.connected = true
      messages.forEach(msg => webSocketService.send(msg))
      
      webSocketService.disconnect()
      
      expect(webSocketService.batchQueue.length).toBe(0)
      expect(webSocketService.messageBuffer).toHaveLength(2)
      expect(webSocketService.messageBuffer[0].data).toBe('message 1')
      expect(webSocketService.messageBuffer[1].data).toBe('message 2')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track message metrics', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      const message = { type: 'test', data: 'hello' }
      await webSocketService.send(message)
      
      const metrics = webSocketService.getMetrics()
      expect(metrics.messagesSent).toBe(1)
      expect(metrics.messagesReceived).toBe(0)
    })

    it('should track error counts', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      triggerWebSocketEvent('message', { data: 'invalid json' })
      
      const metrics = webSocketService.getMetrics()
      expect(metrics.errors).toBe(1)
    })

    it('should calculate average batch size', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      const messages1 = Array.from({ length: 5 }, (_, i) => ({
        type: 'test',
        data: `batch1-${i}`
      }))
      
      const messages2 = Array.from({ length: 3 }, (_, i) => ({
        type: 'test',
        data: `batch2-${i}`
      }))
      
      // Send first batch
      for (const message of messages1) {
        await webSocketService.send(message)
      }
      vi.advanceTimersByTime(100)
      
      // Send second batch
      for (const message of messages2) {
        await webSocketService.send(message)
      }
      vi.advanceTimersByTime(100)
      
      const metrics = webSocketService.getMetrics()
      expect(metrics.averageBatchSize).toBe(4) // (5 + 3) / 2
    })

    it('should reset metrics', async () => {
      const url = 'ws://localhost:8000'
      await webSocketService.connect(url)
      triggerWebSocketEvent('open', {})
      
      const message = { type: 'test', data: 'hello' }
      await webSocketService.send(message)
      
      webSocketService.resetMetrics()
      
      const metrics = webSocketService.getMetrics()
      expect(metrics.messagesSent).toBe(0)
      expect(metrics.messagesReceived).toBe(0)
      expect(metrics.errors).toBe(0)
      expect(metrics.batchesSent).toBe(0)
      expect(metrics.totalBatchSize).toBe(0)
    })
  })
}) 