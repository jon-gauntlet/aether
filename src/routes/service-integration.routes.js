import express from 'express';
import { ServiceIntegrator } from '../services/integration/service-integrator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const serviceIntegrator = new ServiceIntegrator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /services/{serviceName}/{operation}:
 *   post:
 *     tags: [Services]
 *     summary: Execute service operation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: serviceName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: operation
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Service operation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceResponse'
 */
router.post('/:serviceName/:operation', authMiddleware, async (req, res) => {
    try {
        const result = await serviceIntegrator.executeServiceCall(
            req.params.serviceName,
            req.params.operation,
            req.body
        );
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'service-integration-endpoint'
        });
        
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'ServiceIntegrationError'
            }
        });
    }
});

export default router; 