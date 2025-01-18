import express from 'express';
import { DatabaseOptimizer } from '../database/db-optimizer.service';
import { QueryOptimizer } from '../database/query-optimizer.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { SystemMonitor } from '../monitoring/monitor';

const router = express.Router();
const dbOptimizer = new DatabaseOptimizer();
const queryOptimizer = new QueryOptimizer();
const monitor = new SystemMonitor();

router.get('/optimization/status', authMiddleware, async (req, res) => {
    try {
        const recommendations = await dbOptimizer.getOptimizationRecommendations();
        res.json(recommendations);
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'database-optimization-status'
        });
        res.status(500).json({ error: error.message });
    }
});

router.get('/statistics', authMiddleware, async (req, res) => {
    try {
        const statistics = await dbOptimizer.getTableStatistics();
        res.json(statistics);
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'database-statistics'
        });
        res.status(500).json({ error: error.message });
    }
});

router.post('/query/analyze', authMiddleware, async (req, res) => {
    try {
        const { query, params } = req.body;
        const analysis = await queryOptimizer.analyzeQuery(query, params);
        res.json(analysis);
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'query-analyze-endpoint',
            body: req.body
        });
        res.status(500).json({ error: error.message });
    }
});

router.post('/query/optimize', authMiddleware, async (req, res) => {
    try {
        const { query, tableName } = req.body;
        const optimization = await queryOptimizer.optimizeQuery(query, tableName);
        res.json(optimization);
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'query-optimize-endpoint',
            body: req.body
        });
        res.status(500).json({ error: error.message });
    }
});

export default router; 