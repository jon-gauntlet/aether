import express from 'express';
import { DeploymentDocumentationGenerator } from '../docs/deployment/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const deploymentDocGenerator = new DeploymentDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /deployment:
 *   get:
 *     tags: [Deployment]
 *     summary: Get deployment documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about deployment processes and configurations
 *     responses:
 *       200:
 *         description: Deployment documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeploymentDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await deploymentDocGenerator.generateDeploymentDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'deployment-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'DeploymentDocumentationError'
            }
        });
    }
});

export default router; 