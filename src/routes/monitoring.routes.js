import express from 'express';
import { MonitoringDocumentationGenerator } from '../docs/monitoring/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const monitoringDocGenerator = new MonitoringDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /monitoring:
 *   get:
 *     tags: [Monitoring]
 *     summary: Get monitoring documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about monitoring infrastructure and metrics
 *     responses:
 *       200:
 *         description: Monitoring documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MonitoringDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await monitoringDocGenerator.generateMonitoringDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'monitoring-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'MonitoringDocumentationError'
            }
        });
    }
});

export default router; 