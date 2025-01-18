import { SystemMonitor } from '../monitoring/monitor';
import { MetricsCollector } from './metrics-collector';
import { MetricsAggregator } from './metrics-aggregator';
import { MetricsExporter } from './metrics-exporter';
import { MetricsPolicy } from './metrics-policy';

export class MetricsManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.collector = new MetricsCollector();
        this.aggregator = new MetricsAggregator();
        this.exporter = new MetricsExporter();
        this.policy = new MetricsPolicy();
    }

    async recordMetric(name, value, tags = {}) {
        const timestamp = Date.now();
        const metricId = this.generateMetricId();

        try {
            // Check metrics policy
            if (!this.policy.shouldRecord(name, value, tags)) {
                return false;
            }

            // Create metric
            const metric = {
                id: metricId,
                name,
                value,
                tags,
                timestamp
            };

            // Record metric
            await this.collector.record(metric);

            // Aggregate metrics
            await this.aggregator.aggregate(name, value, timestamp);

            return true;
        } catch (error) {
            await this.handleMetricsError(error, 'record', metricId);
            return false;
        }
    }

    async getMetrics(query = {}) {
        try {
            const metrics = await this.collector.query(query);
            const aggregations = await this.aggregator.query(query);

            return {
                metrics,
                aggregations
            };
        } catch (error) {
            await this.handleMetricsError(error, 'query');
            return null;
        }
    }

    async exportMetrics(format = 'prometheus') {
        try {
            const metrics = await this.collector.getAll();
            const aggregations = await this.aggregator.getAll();

            return this.exporter.export(metrics, aggregations, format);
        } catch (error) {
            await this.handleMetricsError(error, 'export');
            return null;
        }
    }

    generateMetricId() {
        return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async handleMetricsError(error, operation, metricId = null) {
        await this.monitor.errorTracker.track(error, {
            context: 'metrics-manager',
            operation,
            metricId
        });
    }
}

export class MetricsCollector {
    constructor() {
        this.monitor = new SystemMonitor();
        this.metrics = new Map();
    }

    async record(metric) {
        const key = this.getMetricKey(metric);
        const series = this.metrics.get(key) || [];
        series.push(metric);
        this.metrics.set(key, series);
    }

    async query(query) {
        const results = [];
        for (const [key, series] of this.metrics) {
            if (this.matchesQuery(key, series, query)) {
                results.push(...series);
            }
        }
        return results;
    }

    async getAll() {
        return Array.from(this.metrics.values()).flat();
    }

    getMetricKey(metric) {
        return `${metric.name}:${JSON.stringify(metric.tags)}`;
    }

    matchesQuery(key, series, query) {
        // Implement query matching logic
        return true;
    }
}

export class MetricsAggregator {
    constructor() {
        this.monitor = new SystemMonitor();
        this.aggregations = new Map();
    }

    async aggregate(name, value, timestamp) {
        const aggregations = this.getAggregations(name);
        
        // Update aggregations
        aggregations.count++;
        aggregations.sum += value;
        aggregations.min = Math.min(aggregations.min, value);
        aggregations.max = Math.max(aggregations.max, value);
        aggregations.avg = aggregations.sum / aggregations.count;
        aggregations.lastUpdate = timestamp;

        this.aggregations.set(name, aggregations);
    }

    async query(query) {
        const results = new Map();
        for (const [name, aggregation] of this.aggregations) {
            if (this.matchesQuery(name, aggregation, query)) {
                results.set(name, aggregation);
            }
        }
        return Array.from(results.entries());
    }

    async getAll() {
        return Array.from(this.aggregations.entries());
    }

    getAggregations(name) {
        return this.aggregations.get(name) || {
            count: 0,
            sum: 0,
            min: Infinity,
            max: -Infinity,
            avg: 0,
            lastUpdate: null
        };
    }

    matchesQuery(name, aggregation, query) {
        // Implement query matching logic
        return true;
    }
}

export class MetricsExporter {
    constructor() {
        this.monitor = new SystemMonitor();
        this.exporters = new Map();
        this.setupExporters();
    }

    setupExporters() {
        // Prometheus exporter
        this.exporters.set('prometheus', {
            export: (metrics, aggregations) => this.exportPrometheus(metrics, aggregations)
        });

        // JSON exporter
        this.exporters.set('json', {
            export: (metrics, aggregations) => this.exportJson(metrics, aggregations)
        });
    }

    async export(metrics, aggregations, format) {
        const exporter = this.exporters.get(format);
        if (!exporter) {
            throw new Error(`Unsupported export format: ${format}`);
        }

        return exporter.export(metrics, aggregations);
    }

    exportPrometheus(metrics, aggregations) {
        let output = '';

        // Export metrics
        for (const metric of metrics) {
            output += this.formatPrometheusMetric(metric);
        }

        // Export aggregations
        for (const [name, aggregation] of aggregations) {
            output += this.formatPrometheusAggregation(name, aggregation);
        }

        return output;
    }

    exportJson(metrics, aggregations) {
        return {
            metrics,
            aggregations: Object.fromEntries(aggregations)
        };
    }

    formatPrometheusMetric(metric) {
        const labels = Object.entries(metric.tags)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',');

        return `${metric.name}{${labels}} ${metric.value} ${metric.timestamp}\n`;
    }

    formatPrometheusAggregation(name, aggregation) {
        let output = '';
        for (const [key, value] of Object.entries(aggregation)) {
            if (key !== 'lastUpdate') {
                output += `${name}_${key} ${value} ${aggregation.lastUpdate}\n`;
            }
        }
        return output;
    }
}

export class MetricsPolicy {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    shouldRecord(name, value, tags = {}) {
        // Check if metric is enabled
        if (!this.isMetricEnabled(name)) {
            return false;
        }

        // Check rate limits
        if (this.isRateLimited(name)) {
            return false;
        }

        // Validate value
        if (!this.isValidValue(value)) {
            return false;
        }

        return true;
    }

    isMetricEnabled(name) {
        const disabledMetrics = process.env.DISABLED_METRICS?.split(',') || [];
        return !disabledMetrics.includes(name);
    }

    isRateLimited(name) {
        // Implement rate limiting logic
        return false;
    }

    isValidValue(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }
} 