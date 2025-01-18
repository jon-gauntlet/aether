import express from 'express';
import { ErrorDocumentationGenerator } from '../docs/error/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const errorDocGenerator = new ErrorDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /error:
 *   get:
 *     tags: [Error]
 *     summary: Get error handling documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about error handling strategies and procedures
 *     responses:
 *       200:
 *         description: Error handling documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await errorDocGenerator.generateErrorDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'error-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'ErrorDocumentationError'
            }
        });
    }
});

export default router; 