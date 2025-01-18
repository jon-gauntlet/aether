import express from 'express';
import { DependencyDocumentationGenerator } from '../docs/dependency/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const dependencyDocGenerator = new DependencyDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /dependency:
 *   get:
 *     tags: [Dependency]
 *     summary: Get dependency documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about project dependencies and their management
 *     responses:
 *       200:
 *         description: Dependency documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DependencyDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await dependencyDocGenerator.generateDependencyDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'dependency-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'DependencyDocumentationError'
            }
        });
    }
});

export default router; 