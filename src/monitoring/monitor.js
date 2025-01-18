import { logger } from '../lib/logger'

class Metrics {
  constructor() {
    this.reset()
  }

  reset() {
    this.requestCount = 0
    this.errorCount = 0
    this.responseTimes = []
    this.statusCodes = new Map()
    this.startTime = Date.now()
  }

  trackRequest() {
    this.requestCount++
  }

  trackError() {
    this.errorCount++
  }

  trackResponse(statusCode, duration) {
    this.responseTimes.push(duration)
    this.statusCodes.set(statusCode, (this.statusCodes.get(statusCode) || 0) + 1)
  }

  getStats() {
    const totalTime = this.responseTimes.reduce((a, b) => a + b, 0)
    const avgResponseTime = this.responseTimes.length ? totalTime / this.responseTimes.length : 0

    return {
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount ? (this.errorCount / this.requestCount) * 100 : 0,
      avgResponseTime,
      statusCodes: Object.fromEntries(this.statusCodes),
      timestamp: new Date().toISOString()
    }
  }
}

class Monitor {
  constructor() {
    this.metrics = new Metrics()
    this.startHealthCheck()
  }

  middleware() {
    return (req, res, next) => {
      const start = Date.now()
      this.metrics.trackRequest()

      // Track response
      res.on('finish', () => {
        const duration = Date.now() - start
        this.metrics.trackResponse(res.statusCode, duration)

        if (res.statusCode >= 400) {
          this.metrics.trackError()
        }
      })

      next()
    }
  }

  async healthCheck() {
    try {
      const stats = this.metrics.getStats()
      
      // Log warnings for concerning metrics
      if (stats.errorRate > 1) {
        logger.warn(`High error rate: ${stats.errorRate.toFixed(2)}%`)
      }
      if (stats.avgResponseTime > 200) {
        logger.warn(`High average response time: ${stats.avgResponseTime.toFixed(2)}ms`)
      }

      return {
        status: 'healthy',
        ...stats
      }
    } catch (error) {
      logger.error('Health check failed', error)
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  private startHealthCheck() {
    // Log health metrics every minute
    setInterval(async () => {
      const health = await this.healthCheck()
      logger.info('Health metrics', health)
    }, 60 * 1000)
  }
}

export const monitor = new Monitor() 