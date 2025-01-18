import { performanceMetrics } from './metrics'
import { performanceLogger } from './logger'

class PerformanceAnalyzer {
  constructor() {
    this.recommendations = new Map()
    this.patterns = {
      render: {
        frequentRenders: {
          threshold: 10, // renders per minute
          description: 'Component is re-rendering frequently',
          suggestion: 'Consider using React.memo or useMemo to prevent unnecessary re-renders'
        },
        slowRenders: {
          threshold: 100, // ms
          description: 'Component has slow render times',
          suggestion: 'Consider code splitting or optimizing component logic'
        }
      },
      network: {
        redundantRequests: {
          threshold: 3, // same request within 5 seconds
          description: 'Multiple identical requests detected',
          suggestion: 'Implement request caching or debouncing'
        },
        largePayloads: {
          threshold: 1024 * 1024, // 1MB
          description: 'Large network payload detected',
          suggestion: 'Consider pagination or data compression'
        }
      },
      memory: {
        highUsage: {
          threshold: 0.8, // 80% of limit
          description: 'High memory usage detected',
          suggestion: 'Check for memory leaks and implement cleanup'
        },
        rapidGrowth: {
          threshold: 0.1, // 10% increase per minute
          description: 'Rapid memory growth detected',
          suggestion: 'Verify object cleanup and event listener removal'
        }
      },
      cpu: {
        highUtilization: {
          threshold: 0.7, // 70% utilization
          description: 'High CPU utilization detected',
          suggestion: 'Optimize expensive computations or move to web worker'
        }
      }
    }
  }

  analyzeComponent(componentName) {
    const renderMetrics = performanceMetrics.getMetrics('render', componentName)
    if (!renderMetrics.length) return null

    const recommendations = []
    const recentRenders = renderMetrics.filter(
      m => m.timestamp > Date.now() - 60000
    )

    // Check render frequency
    if (recentRenders.length >= this.patterns.render.frequentRenders.threshold) {
      recommendations.push({
        type: 'render_frequency',
        level: 'warning',
        component: componentName,
        ...this.patterns.render.frequentRenders,
        metrics: {
          rendersPerMinute: recentRenders.length
        }
      })
    }

    // Check render duration
    const avgRenderTime = performanceMetrics.getAverageMetric('render', componentName)
    if (avgRenderTime > this.patterns.render.slowRenders.threshold) {
      recommendations.push({
        type: 'render_performance',
        level: 'warning',
        component: componentName,
        ...this.patterns.render.slowRenders,
        metrics: {
          averageRenderTime: avgRenderTime
        }
      })
    }

    return recommendations
  }

  analyzeNetworkRequests() {
    const networkMetrics = performanceMetrics.getMetrics('network')
    const recommendations = []

    networkMetrics.forEach((metrics, endpoint) => {
      const recentRequests = metrics.filter(
        m => m.timestamp > Date.now() - 5000
      )

      // Check for redundant requests
      if (recentRequests.length >= this.patterns.network.redundantRequests.threshold) {
        recommendations.push({
          type: 'network_redundancy',
          level: 'warning',
          endpoint,
          ...this.patterns.network.redundantRequests,
          metrics: {
            requestsCount: recentRequests.length,
            timeWindow: '5s'
          }
        })
      }

      // Check payload size
      const avgPayloadSize = metrics.reduce((sum, m) => sum + (m.size || 0), 0) / metrics.length
      if (avgPayloadSize > this.patterns.network.largePayloads.threshold) {
        recommendations.push({
          type: 'network_payload',
          level: 'warning',
          endpoint,
          ...this.patterns.network.largePayloads,
          metrics: {
            averageSize: avgPayloadSize,
            threshold: this.patterns.network.largePayloads.threshold
          }
        })
      }
    })

    return recommendations
  }

  analyzeMemoryUsage() {
    const memoryMetrics = performanceMetrics.getMetrics('memory', 'heap')
    if (!memoryMetrics.length) return []

    const recommendations = []
    const latest = memoryMetrics[memoryMetrics.length - 1]

    // Check current usage
    if (latest.used / latest.limit > this.patterns.memory.highUsage.threshold) {
      recommendations.push({
        type: 'memory_usage',
        level: 'error',
        ...this.patterns.memory.highUsage,
        metrics: {
          currentUsage: latest.used,
          limit: latest.limit,
          usagePercent: (latest.used / latest.limit) * 100
        }
      })
    }

    // Check growth rate
    const oneMinuteAgo = memoryMetrics.find(
      m => m.timestamp > Date.now() - 60000
    )
    if (oneMinuteAgo) {
      const growthRate = (latest.used - oneMinuteAgo.used) / oneMinuteAgo.used
      if (growthRate > this.patterns.memory.rapidGrowth.threshold) {
        recommendations.push({
          type: 'memory_growth',
          level: 'warning',
          ...this.patterns.memory.rapidGrowth,
          metrics: {
            growthRate: growthRate * 100,
            timeWindow: '1m'
          }
        })
      }
    }

    return recommendations
  }

  analyzeCPUUsage() {
    const cpuMetrics = performanceMetrics.getMetrics('cpu', 'usage')
    if (!cpuMetrics.length) return []

    const recommendations = []
    const recentMetrics = cpuMetrics.filter(
      m => m.timestamp > Date.now() - 60000
    )

    const avgLoad = recentMetrics.reduce(
      (sum, m) => sum + m.estimatedLoad,
      0
    ) / recentMetrics.length

    if (avgLoad / 100 > this.patterns.cpu.highUtilization.threshold) {
      recommendations.push({
        type: 'cpu_usage',
        level: 'warning',
        ...this.patterns.cpu.highUtilization,
        metrics: {
          averageUtilization: avgLoad,
          timeWindow: '1m'
        }
      })
    }

    return recommendations
  }

  generateOptimizationSuggestions() {
    const suggestions = {
      components: {},
      network: [],
      memory: [],
      cpu: [],
      timestamp: new Date().toISOString()
    }

    // Analyze all components
    const renderMetrics = performanceMetrics.getMetrics('render')
    renderMetrics.forEach((_, componentName) => {
      const componentRecommendations = this.analyzeComponent(componentName)
      if (componentRecommendations?.length) {
        suggestions.components[componentName] = componentRecommendations
      }
    })

    // Analyze network requests
    suggestions.network = this.analyzeNetworkRequests()

    // Analyze memory usage
    suggestions.memory = this.analyzeMemoryUsage()

    // Analyze CPU usage
    suggestions.cpu = this.analyzeCPUUsage()

    return suggestions
  }

  getCodeSplittingOpportunities() {
    const renderMetrics = performanceMetrics.getMetrics('render')
    const opportunities = []

    renderMetrics.forEach((metrics, componentName) => {
      const avgRenderTime = performanceMetrics.getAverageMetric('render', componentName)
      const renderCount = metrics.length

      // Suggest code splitting for large, infrequently rendered components
      if (avgRenderTime > 50 && renderCount < 5) {
        opportunities.push({
          component: componentName,
          type: 'code_splitting',
          description: 'Large component with infrequent renders',
          suggestion: 'Consider lazy loading this component',
          metrics: {
            averageRenderTime: avgRenderTime,
            renderCount
          }
        })
      }
    })

    return opportunities
  }

  getPrioritizedRecommendations() {
    const suggestions = this.generateOptimizationSuggestions()
    const prioritized = []

    // Helper function to add recommendations with priority
    const addWithPriority = (items, category, basePriority) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          prioritized.push({
            ...item,
            category,
            priority: basePriority + (item.level === 'error' ? 2 : 0)
          })
        })
      } else {
        Object.entries(items).forEach(([name, recs]) => {
          recs.forEach(rec => {
            prioritized.push({
              ...rec,
              category,
              name,
              priority: basePriority + (rec.level === 'error' ? 2 : 0)
            })
          })
        })
      }
    }

    // Add recommendations in priority order
    addWithPriority(suggestions.memory, 'memory', 10)
    addWithPriority(suggestions.cpu, 'cpu', 8)
    addWithPriority(suggestions.components, 'components', 6)
    addWithPriority(suggestions.network, 'network', 4)

    // Sort by priority (highest first)
    return prioritized.sort((a, b) => b.priority - a.priority)
  }
}

export const performanceAnalyzer = new PerformanceAnalyzer()

// Start periodic analysis
setInterval(() => {
  const recommendations = performanceAnalyzer.getPrioritizedRecommendations()
  if (recommendations.length > 0) {
    performanceLogger.log('INFO', 'optimization', 'New optimization recommendations available', {
      recommendationsCount: recommendations.length
    })
  }
}, 60000) // Check every minute 