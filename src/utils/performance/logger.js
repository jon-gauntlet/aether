import { performanceMetrics } from './metrics'

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

class PerformanceLogger {
  constructor() {
    this.logLevel = LOG_LEVELS.INFO
    this.logs = []
    this.thresholds = {
      render: 100, // ms
      network: 1000, // ms
      memory: 50 * 1024 * 1024, // 50MB
      cpu: 30 // percent
    }
    this.alertCallbacks = new Set()
  }

  setLogLevel(level) {
    this.logLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO
  }

  setThreshold(metric, value) {
    this.thresholds[metric] = value
  }

  addAlertCallback(callback) {
    this.alertCallbacks.add(callback)
  }

  removeAlertCallback(callback) {
    this.alertCallbacks.delete(callback)
  }

  log(level, category, message, data = {}) {
    if (LOG_LEVELS[level] >= this.logLevel) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        message,
        data
      }

      this.logs.push(logEntry)
      
      // Keep last 1000 logs
      if (this.logs.length > 1000) {
        this.logs.shift()
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console[level.toLowerCase()](`[${category}] ${message}`, data)
      }
    }
  }

  checkThresholds() {
    // Check render times
    const renderMetrics = performanceMetrics.getMetrics('render')
    renderMetrics.forEach((metrics, componentName) => {
      const lastMetric = metrics[metrics.length - 1]
      if (lastMetric && lastMetric.duration > this.thresholds.render) {
        this.alert('render', `Slow render detected for ${componentName}`, {
          duration: lastMetric.duration,
          threshold: this.thresholds.render
        })
      }
    })

    // Check network requests
    const networkMetrics = performanceMetrics.getMetrics('network')
    networkMetrics.forEach((metrics, requestName) => {
      const lastMetric = metrics[metrics.length - 1]
      if (lastMetric && lastMetric.duration > this.thresholds.network) {
        this.alert('network', `Slow network request detected for ${requestName}`, {
          duration: lastMetric.duration,
          threshold: this.thresholds.network
        })
      }
    })

    // Check memory usage
    const memoryMetrics = performanceMetrics.getMetrics('memory', 'heap')
    const lastMemoryMetric = memoryMetrics[memoryMetrics.length - 1]
    if (lastMemoryMetric && lastMemoryMetric.used > this.thresholds.memory) {
      this.alert('memory', 'High memory usage detected', {
        used: lastMemoryMetric.used,
        threshold: this.thresholds.memory
      })
    }

    // Check CPU usage
    const cpuMetrics = performanceMetrics.getMetrics('cpu', 'usage')
    const lastCPUMetric = cpuMetrics[cpuMetrics.length - 1]
    if (lastCPUMetric && lastCPUMetric.estimatedLoad > this.thresholds.cpu) {
      this.alert('cpu', 'High CPU usage detected', {
        load: lastCPUMetric.estimatedLoad,
        threshold: this.thresholds.cpu
      })
    }
  }

  alert(category, message, data = {}) {
    this.log('WARN', category, message, data)
    
    const alert = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data
    }

    // Notify all registered callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert)
      } catch (error) {
        console.error('Error in alert callback:', error)
      }
    })
  }

  getRecentLogs(count = 100, level = null, category = null) {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    return filteredLogs.slice(-count)
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {
        render: {},
        network: {},
        memory: {},
        cpu: {}
      },
      alerts: this.getRecentLogs(100, 'WARN')
    }

    // Render metrics
    const renderMetrics = performanceMetrics.getMetrics('render')
    renderMetrics.forEach((metrics, componentName) => {
      report.metrics.render[componentName] = {
        average: performanceMetrics.getAverageMetric('render', componentName),
        max: Math.max(...metrics.map(m => m.duration)),
        count: metrics.length
      }
    })

    // Network metrics
    const networkMetrics = performanceMetrics.getMetrics('network')
    networkMetrics.forEach((metrics, requestName) => {
      report.metrics.network[requestName] = {
        average: performanceMetrics.getAverageMetric('network', requestName),
        totalSize: metrics.reduce((acc, m) => acc + (m.size || 0), 0),
        count: metrics.length
      }
    })

    // Memory metrics
    const memoryMetrics = performanceMetrics.getMetrics('memory', 'heap')
    if (memoryMetrics.length > 0) {
      const latest = memoryMetrics[memoryMetrics.length - 1]
      report.metrics.memory = {
        used: latest.used,
        total: latest.total,
        limit: latest.limit
      }
    }

    // CPU metrics
    const cpuMetrics = performanceMetrics.getMetrics('cpu', 'usage')
    if (cpuMetrics.length > 0) {
      report.metrics.cpu = {
        average: performanceMetrics.getAverageMetric('cpu', 'usage', 'estimatedLoad'),
        max: Math.max(...cpuMetrics.map(m => m.estimatedLoad))
      }
    }

    return report
  }
}

export const performanceLogger = new PerformanceLogger()

// Start periodic threshold checks
setInterval(() => {
  performanceLogger.checkThresholds()
}, 5000) // Check every 5 seconds 