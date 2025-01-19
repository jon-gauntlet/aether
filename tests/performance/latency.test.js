import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { WebSocket, WebSocketServer } from 'ws'

describe('Latency Testing with Mock Server', () => {
  let mockServer
  let ws
  const latencies = []
  const PORT = 8001 // Different from real server to avoid conflicts
  const NUM_MESSAGES = 1000
  const MESSAGE_INTERVAL = 10 // 10ms between messages

  beforeAll(() => {
    // Setup mock WebSocket server
    mockServer = new WebSocketServer({ port: PORT })
    
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        // Echo back immediately to measure latency
        socket.send(data)
      })
    })
  })

  afterAll(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    if (mockServer) {
      mockServer.close()
    }
  })

  it('should maintain low latency for 1000 messages', async () => {
    // Connect to mock server
    ws = new WebSocket(`ws://localhost:${PORT}`)
    
    await new Promise((resolve) => {
      ws.on('open', resolve)
    })

    // Send messages and measure latency
    for (let i = 0; i < NUM_MESSAGES; i++) {
      const message = {
        id: `test-${i}`,
        timestamp: Date.now(),
        content: 'Test message'
      }

      const sendTime = Date.now()
      
      await new Promise((resolve) => {
        ws.send(JSON.stringify(message))
        
        ws.once('message', () => {
          const latency = Date.now() - sendTime
          latencies.push(latency)
          resolve()
        })
      })

      // Wait between messages
      await new Promise(resolve => setTimeout(resolve, MESSAGE_INTERVAL))
    }

    // Calculate latency statistics
    const maxLatency = Math.max(...latencies)
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
    const sortedLatencies = [...latencies].sort((a, b) => a - b)
    const p95Latency = sortedLatencies[Math.floor(latencies.length * 0.95)]
    
    console.log(`
      Latency Statistics:
      Max: ${maxLatency}ms
      Average: ${avgLatency.toFixed(2)}ms
      95th Percentile: ${p95Latency}ms
      Total Messages: ${latencies.length}
    `)

    // Verify 95th percentile latency is under 100ms
    expect(p95Latency).toBeLessThan(100)
  }, 60000) // Increase timeout for message sending
}) 