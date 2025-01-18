import { useState, useEffect } from 'react'
import { performanceMetrics } from '../../utils/performance/metrics'
import { performanceLogger } from '../../utils/performance/logger'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

function MetricCard({ title, value, threshold, unit = '', status = 'normal' }) {
  const statusColors = {
    normal: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">
          {value}
          <span className="ml-1 text-sm font-medium text-gray-500">{unit}</span>
        </p>
        {threshold && (
          <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status === 'normal' ? 'Good' : status === 'warning' ? 'Warning' : 'Critical'}
          </span>
        )}
      </div>
    </div>
  )
}

function MetricChart({ data, dataKey, name, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{name}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time) => new Date(time).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(label) => new Date(label).toLocaleTimeString()}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              dot={false}
              name={name}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AlertsList({ alerts }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">Recent Alerts</h3>
      </div>
      <div className="divide-y divide-gray-200 max-h-64 overflow-auto">
        {alerts.map((alert, index) => (
          <div key={index} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{alert.message}</p>
              <span className="text-xs text-gray-500">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {alert.category} - {JSON.stringify(alert.data)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState({
    render: [],
    network: [],
    memory: [],
    cpu: []
  })
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    // Update metrics every second
    const metricsInterval = setInterval(() => {
      setMetrics({
        render: performanceMetrics.getMetrics('render'),
        network: performanceMetrics.getMetrics('network'),
        memory: performanceMetrics.getMetrics('memory', 'heap'),
        cpu: performanceMetrics.getMetrics('cpu', 'usage')
      })
    }, 1000)

    // Subscribe to alerts
    const alertCallback = (alert) => {
      setAlerts(prev => [...prev.slice(-99), alert])
    }
    performanceLogger.addAlertCallback(alertCallback)

    return () => {
      clearInterval(metricsInterval)
      performanceLogger.removeAlertCallback(alertCallback)
    }
  }, [])

  // Calculate current values and statuses
  const memoryUsage = metrics.memory[metrics.memory.length - 1]
  const cpuUsage = metrics.cpu[metrics.cpu.length - 1]
  const averageRenderTime = performanceMetrics.getAverageMetric('render', 'total')
  const averageNetworkTime = performanceMetrics.getAverageMetric('network', 'total')

  const getStatus = (value, threshold) => {
    if (value > threshold) return 'error'
    if (value > threshold * 0.8) return 'warning'
    return 'normal'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Performance Dashboard</h2>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Memory Usage"
          value={memoryUsage ? Math.round(memoryUsage.used / (1024 * 1024)) : 0}
          unit="MB"
          threshold={50}
          status={getStatus(memoryUsage?.used || 0, performanceLogger.thresholds.memory)}
        />
        <MetricCard
          title="CPU Load"
          value={cpuUsage ? Math.round(cpuUsage.estimatedLoad) : 0}
          unit="%"
          threshold={30}
          status={getStatus(cpuUsage?.estimatedLoad || 0, performanceLogger.thresholds.cpu)}
        />
        <MetricCard
          title="Avg Render Time"
          value={Math.round(averageRenderTime)}
          unit="ms"
          threshold={100}
          status={getStatus(averageRenderTime, performanceLogger.thresholds.render)}
        />
        <MetricCard
          title="Avg Network Time"
          value={Math.round(averageNetworkTime)}
          unit="ms"
          threshold={1000}
          status={getStatus(averageNetworkTime, performanceLogger.thresholds.network)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <MetricChart
          data={metrics.cpu}
          dataKey="estimatedLoad"
          name="CPU Usage"
          color="#3B82F6"
        />
        <MetricChart
          data={metrics.memory}
          dataKey="used"
          name="Memory Usage"
          color="#10B981"
        />
      </div>

      {/* Alerts */}
      <AlertsList alerts={alerts} />
    </div>
  )
} 