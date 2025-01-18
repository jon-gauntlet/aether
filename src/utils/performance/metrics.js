import { performance, PerformanceObserver } from 'perf_hooks'

class PerformanceMetrics {
  constructor() {
    this.metrics = new Map()
    this.observers = new Map()
    this.setupObservers()
  }

  setupObservers() {
    // Component render timing
    this.observers.set('render', new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        this.recordMetric('render', entry.name, {
          duration: entry.duration,
          startTime: entry.startTime
        })
      })
    }))
    this.observers.get('render').observe({ entryTypes: ['measure'] })

    // Network requests
    this.observers.set('network', new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach(entry => {
        this.recordMetric('network', entry.name, {
          duration: entry.duration,
          size: entry.transferSize,
          type: entry.initiatorType
        })
      })
    }))
    this.observers.get('network').observe({ entryTypes: ['resource'] })
  }

  startMeasure(name, type = 'custom') {
    const markName = `${type}_${name}_start`
    performance.mark(markName)
    return markName
  }

  endMeasure(name, type = 'custom', startMark) {
    const endMark = `${type}_${name}_end`
    performance.mark(endMark)
    performance.measure(name, startMark, endMark)
  }

  recordMetric(category, name, data) {
    if (!this.metrics.has(category)) {
      this.metrics.set(category, new Map())
    }
    
    const categoryMetrics = this.metrics.get(category)
    if (!categoryMetrics.has(name)) {
      categoryMetrics.set(name, [])
    }
    
    const metrics = categoryMetrics.get(name)
    metrics.push({
      timestamp: Date.now(),
      ...data
    })

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  getMetrics(category, name) {
    if (!this.metrics.has(category)) return []
    const categoryMetrics = this.metrics.get(category)
    if (!categoryMetrics.has(name)) return []
    return categoryMetrics.get(name)
  }

  getAverageMetric(category, name, field = 'duration') {
    const metrics = this.getMetrics(category, name)
    if (metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, metric) => acc + metric[field], 0)
    return sum / metrics.length
  }

  clearMetrics(category, name) {
    if (category && name) {
      const categoryMetrics = this.metrics.get(category)
      if (categoryMetrics) {
        categoryMetrics.delete(name)
      }
    } else if (category) {
      this.metrics.delete(category)
    } else {
      this.metrics.clear()
    }
  }

  // Memory usage monitoring
  measureMemoryUsage() {
    if (performance.memory) {
      this.recordMetric('memory', 'heap', {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      })
    }
  }

  // CPU usage estimation (based on frame timing)
  startCPUMeasurement() {
    let lastTime = performance.now()
    let frames = 0

    const measureFrame = () => {
      const currentTime = performance.now()
      frames++

      if (currentTime >= lastTime + 1000) {
        const fps = frames * 1000 / (currentTime - lastTime)
        const cpuLoad = Math.max(0, Math.min(100, (60 - fps) * 2.5))
        
        this.recordMetric('cpu', 'usage', {
          fps,
          estimatedLoad: cpuLoad
        })

        frames = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFrame)
    }

    requestAnimationFrame(measureFrame)
  }
}

export const performanceMetrics = new PerformanceMetrics()

// React component performance HOC
export function withPerformanceTracking(WrappedComponent, componentName) {
  return function PerformanceTrackedComponent(props) {
    const startMark = performanceMetrics.startMeasure(componentName, 'render')
    
    useEffect(() => {
      performanceMetrics.endMeasure(componentName, 'render', startMark)
    })

    return <WrappedComponent {...props} />
  }
} 