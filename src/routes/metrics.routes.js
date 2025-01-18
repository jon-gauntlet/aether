import express from 'express';
import { MetricsManager } from '../metrics/metrics-manager';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const metricsManager = new MetricsManager();

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags: [Metrics]
 *     summary: Get system metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [json, prometheus]
 *           default: prometheus
 *     responses:
 *       200:
 *         description: System metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsResponse'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const format = req.query.format || 'prometheus';
        const metrics = await metricsManager.exportMetrics(format);

        if (format === 'prometheus') {
            res.set('Content-Type', 'text/plain');
            res.send(metrics);
        } else {
            res.json(metrics);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'MetricsError'
            }
        });
    }
});

export default router; 