import express from 'express';
import { SecurityDocumentationGenerator } from '../docs/security/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const securityDocGenerator = new SecurityDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /security:
 *   get:
 *     tags: [Security]
 *     summary: Get security documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about security measures and policies
 *     responses:
 *       200:
 *         description: Security documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SecurityDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await securityDocGenerator.generateSecurityDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'security-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'SecurityDocumentationError'
            }
        });
    }
});

export default router; 