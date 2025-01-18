import { performance, PerformanceObserver } from 'perf_hooks';
import os from 'os';

export class PerformanceTracker {
    constructor() {
        this.metrics = {
            cpu: {
                usage: [],
                average: 0
            },
            memory: {
                usage: [],
                average: 0
            },
            responseTime: {
                samples: [],
                average: 0,
                p95: 0,
                p99: 0
            },
            eventLoop: {
                lag: [],
                average: 0
            }
        };

        this.sampleSize = 100;
        this.startTime = Date.now();
        this.initializeTracking();
    }

    initializeTracking() {
        // CPU and Memory sampling
        setInterval(() => {
            this.trackSystemMetrics();
        }, 1000);

        // Event loop lag tracking
        this.trackEventLoopLag();
    }

    trackSystemMetrics() {
        // CPU Usage
        const cpuUsage = os.loadavg()[0];
        this.updateMetric('cpu', cpuUsage);

        // Memory Usage
        const usedMemory = process.memoryUsage().heapUsed;
        const totalMemory = os.totalmem();
        const memoryUsage = (usedMemory / totalMemory) * 100;
        this.updateMetric('memory', memoryUsage);
    }

    trackEventLoopLag() {
        let lastCheck = Date.now();
        
        setInterval(() => {
            const now = Date.now();
            const lag = now - lastCheck - 100; // Expected 100ms interval
            this.updateMetric('eventLoop', Math.max(0, lag));
            lastCheck = now;
        }, 100);
    }

    trackResponseTime(duration) {
        this.updateMetric('responseTime', duration);
        this.calculatePercentiles();
    }

    updateMetric(type, value) {
        const metrics = this.metrics[type];
        metrics.usage = metrics.usage || [];
        metrics.usage.push(value);
        
        if (metrics.usage.length > this.sampleSize) {
            metrics.usage.shift();
        }

        metrics.average = metrics.usage.reduce((a, b) => a + b, 0) / metrics.usage.length;
    }

    calculatePercentiles() {
        const samples = [...this.metrics.responseTime.samples].sort((a, b) => a - b);
        const len = samples.length;
        
        if (len > 0) {
            this.metrics.responseTime.p95 = samples[Math.floor(len * 0.95)];
            this.metrics.responseTime.p99 = samples[Math.floor(len * 0.99)];
        }
    }

    getMetrics() {
        return {
            timestamp: new Date(),
            uptime: process.uptime(),
            cpu: {
                current: this.metrics.cpu.usage[this.metrics.cpu.usage.length - 1],
                average: this.metrics.cpu.average,
                trend: this.metrics.cpu.usage.slice(-5)
            },
            memory: {
                current: this.metrics.memory.usage[this.metrics.memory.usage.length - 1],
                average: this.metrics.memory.average,
                trend: this.metrics.memory.usage.slice(-5)
            },
            responseTime: {
                average: this.metrics.responseTime.average,
                p95: this.metrics.responseTime.p95,
                p99: this.metrics.responseTime.p99
            },
            eventLoop: {
                currentLag: this.metrics.eventLoop.lag[this.metrics.eventLoop.lag.length - 1],
                averageLag: this.metrics.eventLoop.average
            }
        };
    }
} 