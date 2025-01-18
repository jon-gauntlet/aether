import express from 'express';
import { ApiDocumentationGenerator } from '../docs/api/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const apiDocGenerator = new ApiDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /api-docs:
 *   get:
 *     tags: [API Documentation]
 *     summary: Get API documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about API endpoints and usage
 *     responses:
 *       200:
 *         description: API documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await apiDocGenerator.generateApiDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'api-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'ApiDocumentationError'
            }
        });
    }
});

export default router; 