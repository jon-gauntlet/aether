import express from 'express';
import { ConfigurationDocumentationGenerator } from '../docs/config/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const configDocGenerator = new ConfigurationDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /config:
 *   get:
 *     tags: [Configuration]
 *     summary: Get configuration documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about system configuration and settings
 *     responses:
 *       200:
 *         description: Configuration documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfigDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await configDocGenerator.generateConfigDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'config-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'ConfigurationDocumentationError'
            }
        });
    }
});

export default router; 