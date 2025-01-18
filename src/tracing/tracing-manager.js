import { SystemMonitor } from '../monitoring/monitor';
import { PerformanceTracker } from '../monitoring/performance-tracker';
import { SpanCollector } from './span-collector';
import { TraceExporter } from './trace-exporter';
import { TracingPolicy } from './tracing-policy';
import { TracingContext } from './tracing-context';

export class TracingManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.performanceTracker = new PerformanceTracker();
        this.spanCollector = new SpanCollector();
        this.exporter = new TraceExporter();
        this.policy = new TracingPolicy();
    }

    async startSpan(name, context = {}) {
        const spanId = this.generateSpanId();
        const traceId = context.traceId || this.generateTraceId();

        try {
            // Check tracing policy
            if (!this.policy.shouldTrace(name, context)) {
                return null;
            }

            // Create span
            const span = {
                id: spanId,
                traceId,
                parentId: context.spanId,
                name,
                startTime: Date.now(),
                tags: context.tags || {},
                status: 'active'
            };

            // Record span
            await this.spanCollector.record(span);

            return new TracingContext(this, span);
        } catch (error) {
            await this.handleTracingError(error, 'start_span', spanId);
            return null;
        }
    }

    async endSpan(span, error = null) {
        try {
            span.endTime = Date.now();
            span.duration = span.endTime - span.startTime;
            span.status = error ? 'error' : 'completed';
            
            if (error) {
                span.error = {
                    message: error.message,
                    stack: error.stack
                };
            }

            await this.spanCollector.update(span);
            await this.trackSpanMetrics(span);

            // Export if root span
            if (!span.parentId) {
                await this.exportTrace(span.traceId);
            }
        } catch (err) {
            await this.handleTracingError(err, 'end_span', span.id);
        }
    }

    async addSpanEvent(span, name, data = {}) {
        try {
            const event = {
                name,
                timestamp: Date.now(),
                data
            };

            span.events = span.events || [];
            span.events.push(event);

            await this.spanCollector.update(span);
        } catch (error) {
            await this.handleTracingError(error, 'add_event', span.id);
        }
    }

    async setSpanTag(span, key, value) {
        try {
            span.tags[key] = value;
            await this.spanCollector.update(span);
        } catch (error) {
            await this.handleTracingError(error, 'set_tag', span.id);
        }
    }

    async getTrace(traceId) {
        try {
            return await this.spanCollector.getTrace(traceId);
        } catch (error) {
            await this.handleTracingError(error, 'get_trace', null, traceId);
            return null;
        }
    }

    async exportTrace(traceId) {
        try {
            const spans = await this.spanCollector.getTrace(traceId);
            await this.exporter.export(spans);
        } catch (error) {
            await this.handleTracingError(error, 'export_trace', null, traceId);
        }
    }

    generateSpanId() {
        return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async handleTracingError(error, operation, spanId = null, traceId = null) {
        await this.monitor.errorTracker.track(error, {
            context: 'tracing-manager',
            operation,
            spanId,
            traceId
        });
    }

    async trackSpanMetrics(span) {
        await this.performanceTracker.trackSpan({
            name: span.name,
            duration: span.duration,
            status: span.status,
            hasError: !!span.error
        });
    }
}

export class SpanCollector {
    constructor() {
        this.monitor = new SystemMonitor();
        this.spans = new Map();
    }

    async record(span) {
        this.spans.set(span.id, span);
    }

    async update(span) {
        this.spans.set(span.id, span);
    }

    async getTrace(traceId) {
        return Array.from(this.spans.values())
            .filter(span => span.traceId === traceId);
    }
}

export class TraceExporter {
    constructor() {
        this.monitor = new SystemMonitor();
        this.exporters = new Map();
        this.setupExporters();
    }

    setupExporters() {
        // Jaeger exporter
        this.exporters.set('jaeger', {
            export: spans => this.exportJaeger(spans)
        });

        // Zipkin exporter
        this.exporters.set('zipkin', {
            export: spans => this.exportZipkin(spans)
        });
    }

    async export(spans, format = 'jaeger') {
        const exporter = this.exporters.get(format);
        if (!exporter) {
            throw new Error(`Unsupported export format: ${format}`);
        }

        return exporter.export(spans);
    }

    exportJaeger(spans) {
        // Implement Jaeger export format
        return spans;
    }

    exportZipkin(spans) {
        // Implement Zipkin export format
        return spans;
    }
}

export class TracingPolicy {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    shouldTrace(name, context = {}) {
        // Check sampling rate
        if (!this.shouldSample()) {
            return false;
        }

        // Check if operation should be traced
        if (!this.isOperationEnabled(name)) {
            return false;
        }

        return true;
    }

    shouldSample() {
        const samplingRate = process.env.TRACING_SAMPLING_RATE || 1.0;
        return Math.random() < samplingRate;
    }

    isOperationEnabled(name) {
        const disabledOperations = process.env.DISABLED_TRACES?.split(',') || [];
        return !disabledOperations.includes(name);
    }
}

export class TracingContext {
    constructor(manager, span) {
        this.manager = manager;
        this.span = span;
    }

    async end(error = null) {
        await this.manager.endSpan(this.span, error);
    }

    async addEvent(name, data = {}) {
        await this.manager.addSpanEvent(this.span, name, data);
    }

    async setTag(key, value) {
        await this.manager.setSpanTag(this.span, key, value);
    }

    getContext() {
        return {
            traceId: this.span.traceId,
            spanId: this.span.id,
            tags: this.span.tags
        };
    }
} 