import { SystemMonitor } from '../monitoring/monitor';

export class TaskDependencyManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.dependencies = new Map();
    }

    addDependency(taskId, dependsOnTaskId) {
        const taskDeps = this.dependencies.get(taskId) || new Set();
        taskDeps.add(dependsOnTaskId);
        this.dependencies.set(taskId, taskDeps);
    }

    removeDependency(taskId, dependsOnTaskId) {
        const taskDeps = this.dependencies.get(taskId);
        if (taskDeps) {
            taskDeps.delete(dependsOnTaskId);
            if (taskDeps.size === 0) {
                this.dependencies.delete(taskId);
            }
        }
    }

    getDependencies(taskId) {
        return Array.from(this.dependencies.get(taskId) || new Set());
    }

    async areDependenciesMet(taskId, scheduler) {
        const dependencies = this.getDependencies(taskId);
        if (!dependencies.length) {
            return true;
        }

        for (const depTaskId of dependencies) {
            const depTask = await scheduler.getTask(depTaskId);
            if (!depTask || depTask.status !== 'completed') {
                return false;
            }
        }
        return true;
    }

    async validateDependencies(taskId, scheduler) {
        const visited = new Set();
        const path = new Set();
        
        const hasCycle = (currentTaskId) => {
            if (path.has(currentTaskId)) {
                return true;
            }
            if (visited.has(currentTaskId)) {
                return false;
            }

            visited.add(currentTaskId);
            path.add(currentTaskId);

            const deps = this.getDependencies(currentTaskId);
            for (const depTaskId of deps) {
                if (hasCycle(depTaskId)) {
                    return true;
                }
            }

            path.delete(currentTaskId);
            return false;
        };

        return !hasCycle(taskId);
    }
} 