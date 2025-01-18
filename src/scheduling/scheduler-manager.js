import { SystemMonitor } from '../monitoring/monitor';
import { PerformanceTracker } from '../monitoring/performance-tracker';
import { TaskScheduler } from './task-scheduler';
import { TaskExecutor } from './task-executor';
import { SchedulingPolicy } from './scheduling-policy';
import { SchedulerStats } from './scheduler-stats';
import { TaskDependencyManager } from './task-dependency-manager';
import { DistributedScheduler } from './distributed-scheduler';

export class SchedulerManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.performanceTracker = new PerformanceTracker();
        this.scheduler = new TaskScheduler();
        this.executor = new TaskExecutor();
        this.policy = new SchedulingPolicy();
        this.stats = new SchedulerStats();
        this.dependencyManager = new TaskDependencyManager();
        this.distributedScheduler = new DistributedScheduler();
        
        this.startHeartbeat();
    }

    async schedule(taskName, data = {}, options = {}) {
        const taskId = this.generateTaskId();
        const startTime = process.hrtime();

        try {
            if (options.dependencies) {
                for (const depTaskId of options.dependencies) {
                    this.dependencyManager.addDependency(taskId, depTaskId);
                }
                
                const isValid = await this.dependencyManager.validateDependencies(taskId, this.scheduler);
                if (!isValid) {
                    throw new Error('Circular dependency detected');
                }
            }

            const task = {
                id: taskId,
                name: taskName,
                data,
                status: 'scheduled',
                schedule: options.schedule || 'once',
                priority: options.priority || 'normal',
                createdAt: Date.now(),
                nextRun: this.calculateNextRun(options.schedule),
                dependencies: options.dependencies || []
            };

            await this.scheduler.schedule(task);
            await this.trackSchedulerMetrics('schedule', task, startTime);

            return taskId;
        } catch (error) {
            await this.handleSchedulerError(error, 'schedule', taskId);
            return false;
        }
    }

    async processScheduledTasks() {
        while (true) {
            try {
                await this.distributedScheduler.registerNode();
                const activeNodes = await this.distributedScheduler.getActiveNodes();

                const tasks = await this.scheduler.getDueTasks();
                
                const executableTasks = [];
                for (const task of tasks) {
                    if (await this.canExecuteTask(task)) {
                        executableTasks.push(task);
                    }
                }

                await Promise.all(executableTasks.map(task => this.executeTask(task)));

                await this.delay(1000);
            } catch (error) {
                await this.handleSchedulerError(error, 'process');
                await this.delay(5000);
            }
        }
    }

    async canExecuteTask(task) {
        const dependenciesMet = await this.dependencyManager.areDependenciesMet(task.id, this.scheduler);
        if (!dependenciesMet) {
            return false;
        }

        const lockAcquired = await this.distributedScheduler.acquireTaskLock(task.id);
        return lockAcquired;
    }

    async executeTask(task) {
        const startTime = process.hrtime();

        try {
            task.status = 'running';
            task.startedAt = Date.now();
            await this.scheduler.updateTask(task);

            const renewalInterval = setInterval(async () => {
                await this.distributedScheduler.renewTaskLock(task.id);
            }, this.distributedScheduler.lockTTL / 2);

            const result = await this.executor.execute(task);

            clearInterval(renewalInterval);
            await this.distributedScheduler.releaseTaskLock(task.id);

            await this.handleTaskCompletion(task, result, startTime);
        } catch (error) {
            await this.distributedScheduler.releaseTaskLock(task.id);
            await this.handleTaskFailure(task, error, startTime);
        }
    }

    async handleTaskCompletion(task, result, startTime) {
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;

        if (task.schedule !== 'once') {
            task.nextRun = this.calculateNextRun(task.schedule);
            task.status = 'scheduled';
        }

        await this.scheduler.updateTask(task);
        await this.trackSchedulerMetrics('complete', task, startTime);
    }

    async handleTaskFailure(task, error, startTime) {
        task.status = 'failed';
        task.error = error.message;
        task.failedAt = Date.now();

        if (task.schedule !== 'once') {
            task.nextRun = this.calculateNextRun(task.schedule);
            task.status = 'scheduled';
        }

        await this.scheduler.updateTask(task);
        await this.trackSchedulerMetrics('fail', task, startTime);
        await this.handleSchedulerError(error, 'execute', task.id);
    }

    calculateNextRun(schedule) {
        if (!schedule || schedule === 'once') {
            return null;
        }

        const now = new Date();
        
        // Parse cron-like schedule string
        // Implement scheduling logic based on the schedule string
        return now.getTime() + 60000; // Default to 1 minute for this example
    }

    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async handleSchedulerError(error, operation, taskId = null) {
        await this.monitor.errorTracker.track(error, {
            context: 'scheduler-manager',
            operation,
            taskId
        });
    }

    async trackSchedulerMetrics(operation, task, startTime) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        const metrics = {
            operation,
            taskId: task.id,
            taskName: task.name,
            status: task.status,
            duration,
            timestamp: Date.now()
        };

        await this.performanceTracker.trackScheduler(metrics);
        await this.stats.record(metrics);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startHeartbeat() {
        setInterval(async () => {
            try {
                await this.distributedScheduler.updateNodeHeartbeat();
            } catch (error) {
                await this.handleSchedulerError(error, 'heartbeat');
            }
        }, 30000);
    }
}

export class TaskScheduler {
    constructor() {
        this.monitor = new SystemMonitor();
        this.tasks = new Map();
    }

    async schedule(task) {
        this.tasks.set(task.id, task);
    }

    async updateTask(task) {
        this.tasks.set(task.id, task);
    }

    async getDueTasks() {
        const now = Date.now();
        return Array.from(this.tasks.values()).filter(task => 
            task.status === 'scheduled' && 
            task.nextRun <= now
        );
    }

    async getTask(taskId) {
        return this.tasks.get(taskId);
    }
}

export class TaskExecutor {
    constructor() {
        this.monitor = new SystemMonitor();
        this.executors = new Map();
        this.setupExecutors();
    }

    setupExecutors() {
        // Register task executors
        this.executors.set('cleanup', {
            execute: task => this.executeCleanup(task)
        });

        this.executors.set('backup', {
            execute: task => this.executeBackup(task)
        });

        this.executors.set('report', {
            execute: task => this.executeReport(task)
        });
    }

    async execute(task) {
        const executor = this.executors.get(task.name);
        if (!executor) {
            throw new Error(`No executor found for task: ${task.name}`);
        }

        return executor.execute(task);
    }

    async executeCleanup(task) {
        // Implement cleanup logic
    }

    async executeBackup(task) {
        // Implement backup logic
    }

    async executeReport(task) {
        // Implement report generation logic
    }
}

export class SchedulingPolicy {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    shouldSchedule(taskName, data = {}, options = {}) {
        // Check if task type is enabled
        if (!this.isTaskEnabled(taskName)) {
            return false;
        }

        // Check concurrent task limits
        if (this.isConcurrencyLimited(taskName)) {
            return false;
        }

        // Validate schedule
        if (!this.isValidSchedule(options.schedule)) {
            return false;
        }

        return true;
    }

    isTaskEnabled(taskName) {
        const disabledTasks = process.env.DISABLED_TASKS?.split(',') || [];
        return !disabledTasks.includes(taskName);
    }

    isConcurrencyLimited(taskName) {
        // Implement concurrency limiting logic
        return false;
    }

    isValidSchedule(schedule) {
        // Implement schedule validation logic
        return true;
    }
}

export class SchedulerStats {
    constructor() {
        this.monitor = new SystemMonitor();
        this.stats = {
            scheduled: 0,
            completed: 0,
            failed: 0,
            total: 0,
            byTask: new Map()
        };
    }

    async record(metrics) {
        this.stats.total++;
        
        switch (metrics.operation) {
            case 'schedule':
                this.stats.scheduled++;
                break;
            case 'complete':
                this.stats.completed++;
                break;
            case 'fail':
                this.stats.failed++;
                break;
        }

        // Update task-specific stats
        const taskStats = this.stats.byTask.get(metrics.taskName) || {
            scheduled: 0,
            completed: 0,
            failed: 0,
            total: 0
        };
        
        taskStats.total++;
        switch (metrics.operation) {
            case 'schedule':
                taskStats.scheduled++;
                break;
            case 'complete':
                taskStats.completed++;
                break;
            case 'fail':
                taskStats.failed++;
                break;
        }

        this.stats.byTask.set(metrics.taskName, taskStats);

        await this.monitor.metricsTracker.track('scheduler', this.stats);
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.completed / this.stats.total,
            byTask: Object.fromEntries(this.stats.byTask)
        };
    }
} 