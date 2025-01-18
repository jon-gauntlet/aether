import express from 'express';
import { TestingDocumentationGenerator } from '../docs/testing/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const testingDocGenerator = new TestingDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /testing:
 *   get:
 *     tags: [Testing]
 *     summary: Get testing documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about testing strategies and infrastructure
 *     responses:
 *       200:
 *         description: Testing documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestingDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await testingDocGenerator.generateTestingDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'testing-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'TestingDocumentationError'
            }
        });
    }
});

export default router; 