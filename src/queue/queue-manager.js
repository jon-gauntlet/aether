import { SystemMonitor } from '../monitoring/monitor';
import { PerformanceTracker } from '../monitoring/performance-tracker';
import { JobQueue } from './job-queue';
import { JobProcessor } from './job-processor';
import { QueuePolicy } from './queue-policy';
import { QueueStats } from './queue-stats';

export class QueueManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.performanceTracker = new PerformanceTracker();
        this.jobQueue = new JobQueue();
        this.jobProcessor = new JobProcessor();
        this.queuePolicy = new QueuePolicy();
        this.queueStats = new QueueStats();
    }

    async enqueue(jobType, data, options = {}) {
        const startTime = process.hrtime();
        const jobId = this.generateJobId();

        try {
            // Check queue policy
            if (!this.queuePolicy.shouldEnqueue(jobType, data, options)) {
                throw new Error('Job rejected by queue policy');
            }

            // Create job
            const job = {
                id: jobId,
                type: jobType,
                data,
                status: 'pending',
                priority: options.priority || 'normal',
                attempts: 0,
                maxAttempts: options.maxAttempts || 3,
                createdAt: Date.now()
            };

            // Add to queue
            await this.jobQueue.add(job);

            // Track metrics
            await this.trackQueueMetrics('enqueue', job, startTime);

            return jobId;
        } catch (error) {
            await this.handleQueueError(error, 'enqueue', jobId);
            throw error;
        }
    }

    async processJobs() {
        while (true) {
            try {
                // Get next job
                const job = await this.jobQueue.getNext();
                if (!job) {
                    await this.delay(1000);
                    continue;
                }

                // Process job
                await this.processJob(job);
            } catch (error) {
                await this.handleQueueError(error, 'process');
                await this.delay(5000);
            }
        }
    }

    async processJob(job) {
        const startTime = process.hrtime();

        try {
            // Update job status
            job.status = 'processing';
            job.startedAt = Date.now();
            await this.jobQueue.update(job);

            // Process job
            const result = await this.jobProcessor.process(job);

            // Mark as completed
            job.status = 'completed';
            job.completedAt = Date.now();
            job.result = result;
            await this.jobQueue.update(job);

            // Track metrics
            await this.trackQueueMetrics('complete', job, startTime);
        } catch (error) {
            // Handle failure
            await this.handleJobFailure(job, error, startTime);
        }
    }

    async handleJobFailure(job, error, startTime) {
        job.attempts++;
        job.lastError = error.message;

        if (job.attempts >= job.maxAttempts) {
            job.status = 'failed';
            await this.jobQueue.update(job);
            await this.trackQueueMetrics('fail', job, startTime);
        } else {
            job.status = 'pending';
            job.nextAttempt = Date.now() + this.calculateBackoff(job.attempts);
            await this.jobQueue.update(job);
            await this.trackQueueMetrics('retry', job, startTime);
        }

        await this.handleQueueError(error, 'process', job.id);
    }

    calculateBackoff(attempts) {
        return Math.min(1000 * Math.pow(2, attempts - 1), 60000);
    }

    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async handleQueueError(error, operation, jobId) {
        await this.monitor.errorTracker.track(error, {
            context: 'queue-manager',
            operation,
            jobId
        });
    }

    async trackQueueMetrics(operation, job, startTime) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        const metrics = {
            operation,
            jobId: job.id,
            jobType: job.type,
            status: job.status,
            duration,
            timestamp: Date.now()
        };

        await this.performanceTracker.trackQueue(metrics);
        await this.queueStats.record(metrics);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export class JobQueue {
    constructor() {
        this.monitor = new SystemMonitor();
        this.queue = new Map();
    }

    async add(job) {
        this.queue.set(job.id, job);
    }

    async getNext() {
        const now = Date.now();
        let nextJob = null;

        for (const job of this.queue.values()) {
            if (job.status === 'pending' && (!job.nextAttempt || job.nextAttempt <= now)) {
                if (!nextJob || this.comparePriority(job, nextJob) < 0) {
                    nextJob = job;
                }
            }
        }

        return nextJob;
    }

    comparePriority(jobA, jobB) {
        const priorities = { high: 0, normal: 1, low: 2 };
        return priorities[jobA.priority] - priorities[jobB.priority];
    }

    async update(job) {
        this.queue.set(job.id, job);
    }
}

export class JobProcessor {
    constructor() {
        this.monitor = new SystemMonitor();
        this.processors = new Map();
    }

    registerProcessor(jobType, processor) {
        this.processors.set(jobType, processor);
    }

    async process(job) {
        const processor = this.processors.get(job.type);
        if (!processor) {
            throw new Error(`No processor registered for job type: ${job.type}`);
        }

        return processor(job.data);
    }
}

export class QueuePolicy {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    shouldEnqueue(jobType, data, options = {}) {
        // Check if job type is valid
        if (!this.isValidJobType(jobType)) {
            return false;
        }

        // Check queue size limits
        if (this.isQueueFull()) {
            return false;
        }

        // Check rate limits
        if (this.isRateLimited(jobType)) {
            return false;
        }

        return true;
    }

    isValidJobType(jobType) {
        const validTypes = ['email', 'notification', 'report', 'cleanup'];
        return validTypes.includes(jobType);
    }

    isQueueFull() {
        // Implement queue size check
        return false;
    }

    isRateLimited(jobType) {
        // Implement rate limiting logic
        return false;
    }
}

export class QueueStats {
    constructor() {
        this.monitor = new SystemMonitor();
        this.stats = {
            enqueued: 0,
            completed: 0,
            failed: 0,
            retried: 0
        };
    }

    async record(metrics) {
        switch (metrics.operation) {
            case 'enqueue':
                this.stats.enqueued++;
                break;
            case 'complete':
                this.stats.completed++;
                break;
            case 'fail':
                this.stats.failed++;
                break;
            case 'retry':
                this.stats.retried++;
                break;
        }

        await this.monitor.metricsTracker.track('queue', this.stats);
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.completed / (this.stats.completed + this.stats.failed)
        };
    }
} 