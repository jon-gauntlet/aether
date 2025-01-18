import { performanceMetrics } from './metrics'
import { performanceLogger } from './logger'
import { performanceAnalyzer } from './analyzer'

class PerformanceReportGenerator {
  constructor() {
    this.reports = []
    this.weeklyReports = []
  }

  generateDailyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      metrics: this.collectMetrics(),
      recommendations: performanceAnalyzer.getPrioritizedRecommendations(),
      trends: this.analyzeTrends(),
      issues: this.identifyIssues()
    }

    this.reports.push(report)
    if (this.reports.length > 7) {
      this.reports.shift()
    }

    return report
  }

  generateWeeklyReport() {
    const weeklyReport = {
      timestamp: new Date().toISOString(),
      period: 'weekly',
      summary: this.generateWeeklySummary(),
      trends: this.analyzeWeeklyTrends(),
      recommendations: this.aggregateRecommendations(),
      improvements: this.trackImprovements(),
      nextSteps: this.suggestNextSteps()
    }

    this.weeklyReports.push(weeklyReport)
    if (this.weeklyReports.length > 4) {
      this.weeklyReports.shift()
    }

    return weeklyReport
  }

  generateSummary() {
    const metrics = performanceMetrics.getMetrics('render')
    const networkMetrics = performanceMetrics.getMetrics('network')
    const memoryMetrics = performanceMetrics.getMetrics('memory', 'heap')
    const cpuMetrics = performanceMetrics.getMetrics('cpu', 'usage')

    return {
      components: {
        total: metrics.size,
        problematic: Array.from(metrics.entries()).filter(([_, data]) => 
          performanceMetrics.getAverageMetric('render', data) > 100
        ).length
      },
      performance: {
        averageRenderTime: Array.from(metrics.entries()).reduce((acc, [_, data]) => 
          acc + performanceMetrics.getAverageMetric('render', data), 0
        ) / Math.max(metrics.size, 1),
        slowComponents: Array.from(metrics.entries())
          .filter(([_, data]) => performanceMetrics.getAverageMetric('render', data) > 100)
          .map(([name]) => name)
      },
      network: {
        totalRequests: Array.from(networkMetrics.entries()).reduce((acc, [_, data]) => 
          acc + data.length, 0
        ),
        averageResponseTime: Array.from(networkMetrics.entries()).reduce((acc, [_, data]) => 
          acc + performanceMetrics.getAverageMetric('network', data), 0
        ) / Math.max(networkMetrics.size, 1)
      },
      memory: memoryMetrics.length > 0 ? {
        current: memoryMetrics[memoryMetrics.length - 1].used,
        peak: Math.max(...memoryMetrics.map(m => m.used))
      } : null,
      cpu: cpuMetrics.length > 0 ? {
        averageLoad: cpuMetrics.reduce((acc, m) => acc + m.estimatedLoad, 0) / cpuMetrics.length,
        peakLoad: Math.max(...cpuMetrics.map(m => m.estimatedLoad))
      } : null
    }
  }

  collectMetrics() {
    return {
      render: Object.fromEntries(
        Array.from(performanceMetrics.getMetrics('render').entries()).map(([name, data]) => [
          name,
          {
            average: performanceMetrics.getAverageMetric('render', name),
            count: data.length,
            trend: this.calculateTrend(data.map(m => m.duration))
          }
        ])
      ),
      network: Object.fromEntries(
        Array.from(performanceMetrics.getMetrics('network').entries()).map(([name, data]) => [
          name,
          {
            average: performanceMetrics.getAverageMetric('network', name),
            totalSize: data.reduce((acc, m) => acc + (m.size || 0), 0),
            count: data.length
          }
        ])
      ),
      memory: this.summarizeMetrics(performanceMetrics.getMetrics('memory', 'heap')),
      cpu: this.summarizeMetrics(performanceMetrics.getMetrics('cpu', 'usage'))
    }
  }

  analyzeTrends() {
    const trends = {
      render: {},
      network: {},
      memory: null,
      cpu: null
    }

    // Analyze render time trends
    const renderMetrics = performanceMetrics.getMetrics('render')
    renderMetrics.forEach((metrics, componentName) => {
      trends.render[componentName] = this.calculateTrend(
        metrics.map(m => ({ value: m.duration, timestamp: m.timestamp }))
      )
    })

    // Analyze network request trends
    const networkMetrics = performanceMetrics.getMetrics('network')
    networkMetrics.forEach((metrics, endpoint) => {
      trends.network[endpoint] = this.calculateTrend(
        metrics.map(m => ({ value: m.duration, timestamp: m.timestamp }))
      )
    })

    // Analyze memory usage trend
    const memoryMetrics = performanceMetrics.getMetrics('memory', 'heap')
    if (memoryMetrics.length > 0) {
      trends.memory = this.calculateTrend(
        memoryMetrics.map(m => ({ value: m.used, timestamp: m.timestamp }))
      )
    }

    // Analyze CPU usage trend
    const cpuMetrics = performanceMetrics.getMetrics('cpu', 'usage')
    if (cpuMetrics.length > 0) {
      trends.cpu = this.calculateTrend(
        cpuMetrics.map(m => ({ value: m.estimatedLoad, timestamp: m.timestamp }))
      )
    }

    return trends
  }

  identifyIssues() {
    const issues = []
    const summary = this.generateSummary()

    // Check component performance
    if (summary.components.problematic > 0) {
      issues.push({
        category: 'components',
        severity: 'warning',
        description: `${summary.components.problematic} components have slow render times`,
        components: summary.performance.slowComponents
      })
    }

    // Check memory usage
    if (summary.memory && summary.memory.current > 50 * 1024 * 1024) {
      issues.push({
        category: 'memory',
        severity: 'warning',
        description: 'Memory usage is above recommended threshold',
        current: summary.memory.current,
        threshold: 50 * 1024 * 1024
      })
    }

    // Check CPU usage
    if (summary.cpu && summary.cpu.averageLoad > 30) {
      issues.push({
        category: 'cpu',
        severity: 'warning',
        description: 'CPU usage is above recommended threshold',
        current: summary.cpu.averageLoad,
        threshold: 30
      })
    }

    return issues
  }

  generateWeeklySummary() {
    const dailyReports = this.reports
    if (dailyReports.length === 0) return null

    return {
      period: {
        start: dailyReports[0].timestamp,
        end: dailyReports[dailyReports.length - 1].timestamp
      },
      performance: {
        averageRenderTime: dailyReports.reduce((acc, report) => 
          acc + report.summary.performance.averageRenderTime, 0
        ) / dailyReports.length,
        problematicComponents: this.findConsistentProblems(
          dailyReports.map(r => r.summary.performance.slowComponents)
        )
      },
      memory: {
        averageUsage: dailyReports.reduce((acc, report) => 
          acc + (report.summary.memory ? report.summary.memory.current : 0), 0
        ) / dailyReports.length,
        trend: this.calculateTrend(
          dailyReports.map(r => ({
            value: r.summary.memory ? r.summary.memory.current : 0,
            timestamp: new Date(r.timestamp).getTime()
          }))
        )
      },
      cpu: {
        averageLoad: dailyReports.reduce((acc, report) => 
          acc + (report.summary.cpu ? report.summary.cpu.averageLoad : 0), 0
        ) / dailyReports.length,
        trend: this.calculateTrend(
          dailyReports.map(r => ({
            value: r.summary.cpu ? report.summary.cpu.averageLoad : 0,
            timestamp: new Date(r.timestamp).getTime()
          }))
        )
      }
    }
  }

  analyzeWeeklyTrends() {
    const weeklyReports = this.weeklyReports
    if (weeklyReports.length < 2) return null

    return {
      performance: this.calculateTrend(
        weeklyReports.map(r => ({
          value: r.summary.performance.averageRenderTime,
          timestamp: new Date(r.timestamp).getTime()
        }))
      ),
      memory: this.calculateTrend(
        weeklyReports.map(r => ({
          value: r.summary.memory.averageUsage,
          timestamp: new Date(r.timestamp).getTime()
        }))
      ),
      cpu: this.calculateTrend(
        weeklyReports.map(r => ({
          value: r.summary.cpu.averageLoad,
          timestamp: new Date(r.timestamp).getTime()
        }))
      )
    }
  }

  aggregateRecommendations() {
    const allRecommendations = this.reports.flatMap(r => r.recommendations)
    const aggregated = new Map()

    allRecommendations.forEach(rec => {
      const key = `${rec.category}_${rec.type}_${rec.name || ''}`
      if (!aggregated.has(key)) {
        aggregated.set(key, {
          ...rec,
          frequency: 1
        })
      } else {
        aggregated.get(key).frequency++
      }
    })

    return Array.from(aggregated.values())
      .sort((a, b) => b.frequency - a.frequency)
  }

  trackImprovements() {
    const firstReport = this.reports[0]
    const lastReport = this.reports[this.reports.length - 1]
    if (!firstReport || !lastReport) return null

    return {
      renderTime: {
        change: (
          lastReport.summary.performance.averageRenderTime -
          firstReport.summary.performance.averageRenderTime
        ) / firstReport.summary.performance.averageRenderTime * 100,
        improved: lastReport.summary.performance.averageRenderTime <
          firstReport.summary.performance.averageRenderTime
      },
      memory: firstReport.summary.memory && lastReport.summary.memory ? {
        change: (
          lastReport.summary.memory.current -
          firstReport.summary.memory.current
        ) / firstReport.summary.memory.current * 100,
        improved: lastReport.summary.memory.current <
          firstReport.summary.memory.current
      } : null,
      cpu: firstReport.summary.cpu && lastReport.summary.cpu ? {
        change: (
          lastReport.summary.cpu.averageLoad -
          firstReport.summary.cpu.averageLoad
        ) / firstReport.summary.cpu.averageLoad * 100,
        improved: lastReport.summary.cpu.averageLoad <
          firstReport.summary.cpu.averageLoad
      } : null
    }
  }

  suggestNextSteps() {
    const improvements = this.trackImprovements()
    const recommendations = this.aggregateRecommendations()
    const suggestions = []

    // Suggest based on trends
    if (improvements.renderTime && !improvements.renderTime.improved) {
      suggestions.push({
        priority: 'high',
        category: 'performance',
        action: 'Optimize component render times',
        details: 'Focus on components with consistently slow render times'
      })
    }

    if (improvements.memory && !improvements.memory.improved) {
      suggestions.push({
        priority: 'high',
        category: 'memory',
        action: 'Investigate memory usage patterns',
        details: 'Look for memory leaks and optimize resource cleanup'
      })
    }

    // Add most frequent recommendations
    recommendations.slice(0, 3).forEach(rec => {
      suggestions.push({
        priority: rec.frequency > 5 ? 'high' : 'medium',
        category: rec.category,
        action: rec.suggestion,
        details: `Occurred ${rec.frequency} times this week`
      })
    })

    return suggestions.sort((a, b) => 
      a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0
    )
  }

  calculateTrend(data) {
    if (!Array.isArray(data) || data.length < 2) return null

    const values = Array.isArray(data[0]) ? data : data.map(d => 
      typeof d === 'object' ? [new Date(d.timestamp).getTime(), d.value] : d
    )

    const n = values.length
    const sumX = values.reduce((acc, [x]) => acc + x, 0)
    const sumY = values.reduce((acc, [_, y]) => acc + y, 0)
    const sumXY = values.reduce((acc, [x, y]) => acc + x * y, 0)
    const sumXX = values.reduce((acc, [x]) => acc + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return {
      slope,
      intercept,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      strength: Math.abs(slope)
    }
  }

  summarizeMetrics(metrics) {
    if (!metrics || metrics.length === 0) return null

    const values = metrics.map(m => m.value || m.used || m.estimatedLoad)
    return {
      current: values[values.length - 1],
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      trend: this.calculateTrend(
        metrics.map(m => ({
          value: m.value || m.used || m.estimatedLoad,
          timestamp: m.timestamp
        }))
      )
    }
  }

  findConsistentProblems(problemSets) {
    const frequency = new Map()
    problemSets.forEach(set => {
      set.forEach(problem => {
        frequency.set(problem, (frequency.get(problem) || 0) + 1)
      })
    })

    return Array.from(frequency.entries())
      .filter(([_, count]) => count >= problemSets.length * 0.7)
      .map(([problem]) => problem)
  }
}

export const performanceReporter = new PerformanceReportGenerator()

// Generate daily reports
setInterval(() => {
  const dailyReport = performanceReporter.generateDailyReport()
  performanceLogger.log('INFO', 'reports', 'Generated daily performance report', {
    timestamp: dailyReport.timestamp
  })
}, 24 * 60 * 60 * 1000) // Daily

// Generate weekly reports
setInterval(() => {
  const weeklyReport = performanceReporter.generateWeeklyReport()
  performanceLogger.log('INFO', 'reports', 'Generated weekly performance report', {
    timestamp: weeklyReport.timestamp,
    period: weeklyReport.period
  })
}, 7 * 24 * 60 * 60 * 1000) // Weekly 