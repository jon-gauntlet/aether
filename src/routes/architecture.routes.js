import express from 'express';
import { ArchitectureDocumentationGenerator } from '../docs/architecture/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const architectureDocGenerator = new ArchitectureDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /architecture:
 *   get:
 *     tags: [Architecture]
 *     summary: Get architecture documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about system architecture and design
 *     responses:
 *       200:
 *         description: Architecture documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArchitectureDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await architectureDocGenerator.generateArchitectureDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'architecture-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'ArchitectureDocumentationError'
            }
        });
    }
});

export default router; 