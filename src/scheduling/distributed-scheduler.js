import { SystemMonitor } from '../monitoring/monitor';
import { RedisClient } from '../cache/redis-client';

export class DistributedScheduler {
    constructor() {
        this.monitor = new SystemMonitor();
        this.redis = new RedisClient();
        this.nodeId = this.generateNodeId();
        this.lockTTL = 30000; // 30 seconds
    }

    async acquireTaskLock(taskId) {
        const lockKey = `task_lock:${taskId}`;
        const acquired = await this.redis.set(lockKey, this.nodeId, 'NX', 'PX', this.lockTTL);
        return acquired === 'OK';
    }

    async renewTaskLock(taskId) {
        const lockKey = `task_lock:${taskId}`;
        const currentHolder = await this.redis.get(lockKey);
        
        if (currentHolder === this.nodeId) {
            await this.redis.pexpire(lockKey, this.lockTTL);
            return true;
        }
        return false;
    }

    async releaseTaskLock(taskId) {
        const lockKey = `task_lock:${taskId}`;
        const currentHolder = await this.redis.get(lockKey);
        
        if (currentHolder === this.nodeId) {
            await this.redis.del(lockKey);
            return true;
        }
        return false;
    }

    async registerNode() {
        const nodeKey = `scheduler_node:${this.nodeId}`;
        await this.redis.hmset(nodeKey, {
            lastHeartbeat: Date.now(),
            status: 'active'
        });
        await this.redis.expire(nodeKey, 60);
    }

    async updateNodeHeartbeat() {
        const nodeKey = `scheduler_node:${this.nodeId}`;
        await this.redis.hset(nodeKey, 'lastHeartbeat', Date.now());
        await this.redis.expire(nodeKey, 60);
    }

    async getActiveNodes() {
        const nodes = await this.redis.keys('scheduler_node:*');
        const activeNodes = [];

        for (const nodeKey of nodes) {
            const nodeInfo = await this.redis.hgetall(nodeKey);
            if (Date.now() - nodeInfo.lastHeartbeat < 60000) {
                activeNodes.push({
                    id: nodeKey.split(':')[1],
                    ...nodeInfo
                });
            }
        }

        return activeNodes;
    }

    generateNodeId() {
        return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
} 