import express from 'express';
import { DatabaseOptimizer } from '../database/optimization/database-optimizer';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const dbOptimizer = new DatabaseOptimizer();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /database/optimize:
 *   post:
 *     tags: [Database]
 *     summary: Analyze and optimize database performance
 *     security:
 *       - bearerAuth: []
 *     description: Performs comprehensive database analysis and returns optimization recommendations
 *     responses:
 *       200:
 *         description: Database optimization results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatabaseOptimizationResult'
 */
router.post('/optimize', authMiddleware, async (req, res) => {
    try {
        const optimizationResults = await dbOptimizer.analyzeAndOptimize();
        res.json({
            success: true,
            data: optimizationResults
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'database-optimization-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'DatabaseOptimizationError'
            }
        });
    }
});

export default router; 