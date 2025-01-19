import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'

const WS_URL = 'ws://localhost:8000/ws/test-channel'
const NUM_MESSAGES = 1000
const MESSAGE_INTERVAL = 100 // Send a message every 100ms
const CONNECTION_TIMEOUT = 5000 // 5 seconds timeout

describe('Memory Leak Testing', () => {
  let ws
  let startHeapUsed
  let messagesSent = 0

  beforeAll(() => {
    startHeapUsed = process.memoryUsage().heapUsed
  })

  afterAll(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  })

  it('should not leak memory after sending 1000 messages', async () => {
    // Create WebSocket connection
    ws = new WebSocket(WS_URL)
    
    // Add error handling
    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
    
    // Wait for connection with timeout
    await Promise.race([
      new Promise((resolve, reject) => {
        ws.on('open', resolve)
        ws.on('error', reject)
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
      )
    ])

    // Send messages and track memory
    const memorySnapshots = []
    
    for (let i = 0; i < NUM_MESSAGES; i++) {
      const message = {
        id: `test-${i}`,
        content: 'Test message',
        timestamp: Date.now()
      }

      ws.send(JSON.stringify(message))
      messagesSent++

      // Take memory snapshot every 100 messages
      if (i % 100 === 0) {
        memorySnapshots.push(process.memoryUsage().heapUsed)
      }

      // Wait for message interval
      await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL))
    }

    // Get final memory usage
    const endHeapUsed = process.memoryUsage().heapUsed
    const heapGrowth = endHeapUsed - startHeapUsed
    
    // Log memory statistics
    console.log(`
      Memory Statistics:
      Initial Heap: ${startHeapUsed / 1024 / 1024} MB
      Final Heap: ${endHeapUsed / 1024 / 1024} MB
      Growth: ${heapGrowth / 1024 / 1024} MB
      Messages Sent: ${messagesSent}
      Average Memory per Message: ${(heapGrowth / messagesSent / 1024).toFixed(2)} KB
    `)

    // Verify memory growth is reasonable
    // Allow for some memory growth but not excessive (less than 50MB)
    expect(heapGrowth).toBeLessThan(50 * 1024 * 1024)
    
    // Verify memory growth is not linear with messages
    // Compare first and last 100 messages memory growth
    const initialGrowthRate = (memorySnapshots[1] - memorySnapshots[0]) / 100
    const finalGrowthRate = (memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[memorySnapshots.length - 2]) / 100
    
    // Final growth rate should not be significantly higher than initial
    expect(finalGrowthRate).toBeLessThan(initialGrowthRate * 1.5)
  }, 60000) // Increase timeout for message sending
}) 