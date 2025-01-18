import express from 'express';
import { SystemMonitor } from '../monitoring/monitor';

const router = express.Router();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /versions:
 *   get:
 *     tags: [System]
 *     summary: Get API version information
 *     description: Returns information about available API versions
 *     responses:
 *       200:
 *         description: Version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     versions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VersionInfo'
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            versions: [
                {
                    version: '1.0.0',
                    status: 'stable',
                    features: [
                        'Basic user management',
                        'Authentication',
                        'Basic metrics'
                    ]
                },
                {
                    version: '2.0.0',
                    status: 'beta',
                    features: [
                        'Enhanced user management',
                        'Role-based access control',
                        'Advanced metrics'
                    ]
                },
                {
                    version: '0.9.0',
                    status: 'deprecated',
                    features: ['Legacy features'],
                    deprecationDate: '2024-01-01T00:00:00Z',
                    sunsetDate: '2024-06-01T00:00:00Z'
                }
            ]
        }
    });
});

export default router; 