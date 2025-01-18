import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { performanceMetrics } from '../metrics'
import { performanceLogger } from '../logger'

// Mock performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  now: vi.fn(),
  memory: {
    usedJSHeapSize: 40 * 1024 * 1024,
    totalJSHeapSize: 60 * 1024 * 1024,
    jsHeapSizeLimit: 100 * 1024 * 1024
  }
}

global.performance = mockPerformance
global.PerformanceObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}))

describe('Performance Monitoring System', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    performanceMetrics.clearMetrics()
    performanceLogger.clearLogs()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('Metrics Collection', () => {
    test('records component render times', () => {
      const startMark = performanceMetrics.startMeasure('TestComponent', 'render')
      vi.advanceTimersByTime(50)
      performanceMetrics.endMeasure('TestComponent', 'render', startMark)

      const metrics = performanceMetrics.getMetrics('render', 'TestComponent')
      expect(metrics).toBeDefined()
      expect(metrics.length).toBeGreaterThan(0)
    })

    test('tracks memory usage', () => {
      performanceMetrics.measureMemoryUsage()

      const metrics = performanceMetrics.getMetrics('memory', 'heap')
      expect(metrics).toBeDefined()
      expect(metrics[0].used).toBe(40 * 1024 * 1024)
      expect(metrics[0].total).toBe(60 * 1024 * 1024)
    })

    test('estimates CPU usage', () => {
      let time = 0
      mockPerformance.now.mockImplementation(() => time)

      // Simulate 60 FPS
      performanceMetrics.startCPUMeasurement()
      for (let i = 0; i < 60; i++) {
        time += 16.67 // ~60 FPS
        vi.advanceTimersByTime(16.67)
        global.requestAnimationFrame.mock.calls[i][0]()
      }

      const metrics = performanceMetrics.getMetrics('cpu', 'usage')
      expect(metrics).toBeDefined()
      expect(metrics[0].fps).toBeCloseTo(60, 0)
      expect(metrics[0].estimatedLoad).toBeLessThan(30)
    })

    test('limits metric history', () => {
      // Record 150 metrics (limit is 100)
      for (let i = 0; i < 150; i++) {
        performanceMetrics.recordMetric('test', 'metric', { value: i })
      }

      const metrics = performanceMetrics.getMetrics('test', 'metric')
      expect(metrics.length).toBe(100)
      expect(metrics[0].value).toBe(50) // First 50 should be dropped
    })
  })

  describe('Performance Logging', () => {
    test('logs performance alerts', () => {
      const mockCallback = vi.fn()
      performanceLogger.addAlertCallback(mockCallback)

      performanceLogger.alert('render', 'Slow render detected', { duration: 150 })

      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        category: 'render',
        message: 'Slow render detected',
        data: { duration: 150 }
      }))
    })

    test('checks thresholds and triggers alerts', () => {
      // Record metrics above thresholds
      performanceMetrics.recordMetric('render', 'SlowComponent', {
        duration: 200 // Above 100ms threshold
      })

      performanceMetrics.recordMetric('memory', 'heap', {
        used: 60 * 1024 * 1024 // Above 50MB threshold
      })

      const mockCallback = vi.fn()
      performanceLogger.addAlertCallback(mockCallback)
      performanceLogger.checkThresholds()

      expect(mockCallback).toHaveBeenCalledTimes(2)
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'render',
          message: expect.stringContaining('Slow render detected')
        })
      )
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'memory',
          message: expect.stringContaining('High memory usage')
        })
      )
    })

    test('generates performance reports', () => {
      // Record some test metrics
      performanceMetrics.recordMetric('render', 'Component', { duration: 50 })
      performanceMetrics.recordMetric('render', 'Component', { duration: 100 })
      performanceMetrics.recordMetric('network', 'API', { duration: 200, size: 1024 })
      performanceMetrics.measureMemoryUsage()

      const report = performanceLogger.generatePerformanceReport()

      expect(report).toMatchObject({
        timestamp: expect.any(String),
        metrics: {
          render: {
            Component: {
              average: 75,
              max: 100,
              count: 2
            }
          },
          network: {
            API: {
              average: 200,
              totalSize: 1024,
              count: 1
            }
          },
          memory: {
            used: 40 * 1024 * 1024,
            total: 60 * 1024 * 1024,
            limit: 100 * 1024 * 1024
          }
        }
      })
    })
  })

  describe('Performance Optimization', () => {
    test('HOC adds performance tracking to components', async () => {
      const TestComponent = () => <div>Test</div>
      const WrappedComponent = performanceMetrics.withPerformanceTracking(TestComponent, 'TestComponent')

      // Render wrapped component
      const { unmount } = render(<WrappedComponent />)

      // Wait for next tick to allow useEffect to run
      await vi.runAllTimersAsync()

      // Check that performance marks were created
      expect(mockPerformance.mark).toHaveBeenCalledWith(expect.stringContaining('TestComponent'))
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'TestComponent',
        expect.any(String),
        expect.any(String)
      )

      unmount()
    })

    test('tracks long-running operations', async () => {
      const startMark = performanceMetrics.startMeasure('LongOperation')
      
      // Simulate long operation
      vi.advanceTimersByTime(2000)
      
      performanceMetrics.endMeasure('LongOperation', 'custom', startMark)

      const metrics = performanceMetrics.getMetrics('custom', 'LongOperation')
      expect(metrics[0].duration).toBeGreaterThanOrEqual(2000)
    })
  })
}) 