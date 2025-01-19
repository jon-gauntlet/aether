import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'

const WS_URL = 'ws://localhost:8000/ws/test-channel'
const NUM_CONNECTIONS = 1000
const TEST_DURATION = 10000 // 10 seconds
const MESSAGE_INTERVAL = 100 // Send a message every 100ms
const CONNECTION_TIMEOUT = 5000 // 5 seconds timeout for each connection

describe('WebSocket Load Testing', () => {
  let connections = []
  let startHeapUsed

  beforeAll(() => {
    startHeapUsed = process.memoryUsage().heapUsed
  })

  afterAll(() => {
    // Close all connections
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
  })

  it('should handle 1000 concurrent connections', async () => {
    const batchSize = 100 // Connect in batches to avoid overwhelming the server
    const batches = Math.ceil(NUM_CONNECTIONS / batchSize)
    
    for (let batch = 0; batch < batches; batch++) {
      const batchConnections = await Promise.all(
        Array(Math.min(batchSize, NUM_CONNECTIONS - batch * batchSize))
          .fill(null)
          .map(async (_, i) => {
            const ws = new WebSocket(WS_URL)
            
            // Add error handling
            ws.onerror = (error) => {
              console.error(`WebSocket error on connection ${batch * batchSize + i}:`, error)
            }
            
            // Wait for connection with timeout
            await Promise.race([
              new Promise((resolve, reject) => {
                ws.on('open', () => resolve(ws))
                ws.on('error', reject)
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
              )
            ])
            
            return ws
          })
      )
      
      connections.push(...batchConnections)
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    expect(connections.length).toBe(NUM_CONNECTIONS)
    
    // Verify all connections are open
    const openConnections = connections.filter(
      ws => ws.readyState === WebSocket.OPEN
    )
    expect(openConnections.length).toBe(NUM_CONNECTIONS)
  }, 60000) // Increase timeout for connection establishment

  it('should maintain stable memory usage with 1000 messages', async () => {
    const messages = []
    const latencies = []
    const batchSize = 100 // Process messages in batches
    
    // Send messages in batches
    for (let i = 0; i < connections.length; i += batchSize) {
      const batch = connections.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (ws, j) => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn(`Connection ${i + j} is not open, skipping...`)
          return
        }
        
        const message = { 
          id: `test-${i + j}`, 
          content: 'Test message', 
          timestamp: Date.now() 
        }
        
        const start = Date.now()
        
        try {
          ws.send(JSON.stringify(message))
          messages.push(message)
          
          // Wait for echo response
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Message timeout'))
            }, 5000)
            
            ws.once('message', () => {
              clearTimeout(timeout)
              latencies.push(Date.now() - start)
              resolve()
            })
          })
        } catch (error) {
          console.error(`Error sending message on connection ${i + j}:`, error)
        }
      }))
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Verify memory usage
    const endHeapUsed = process.memoryUsage().heapUsed
    const heapGrowth = endHeapUsed - startHeapUsed
    
    // Allow for some memory growth but not excessive
    expect(heapGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
    
    // Verify latencies
    const maxLatency = Math.max(...latencies)
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
    
    expect(p95Latency).toBeLessThan(100) // 95th percentile < 100ms
    console.log(`
      Latency Stats:
      Max: ${maxLatency}ms
      Avg: ${avgLatency.toFixed(2)}ms
      95th: ${p95Latency}ms
      Total Messages: ${messages.length}
    `)
  }, 60000) // Increase timeout for message processing
}) 