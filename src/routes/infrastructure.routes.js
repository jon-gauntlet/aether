import express from 'express';
import { InfrastructureDocumentationGenerator } from '../docs/infrastructure/documentation-generator';
import { InfrastructureDiagramGenerator } from '../docs/infrastructure/diagram-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const infraDocGenerator = new InfrastructureDocumentationGenerator();
const diagramGenerator = new InfrastructureDiagramGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /infrastructure:
 *   get:
 *     tags: [Infrastructure]
 *     summary: Get infrastructure documentation
 *     security:
 *       - bearerAuth: []
 *     description: Returns comprehensive documentation about the system infrastructure
 *     responses:
 *       200:
 *         description: Infrastructure documentation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InfrastructureDoc'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await infraDocGenerator.generateInfrastructureDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'infrastructure-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'InfrastructureDocumentationError'
            }
        });
    }
});

/**
 * @swagger
 * /infrastructure/diagrams:
 *   get:
 *     tags: [Infrastructure]
 *     summary: Get infrastructure diagrams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [architecture, network, deployment, security, all]
 *         description: Type of diagram to retrieve
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [mermaid, svg]
 *         description: Output format for the diagram
 *     description: |
 *       Returns visual diagrams of the infrastructure architecture,
 *       network topology, deployment flow, or security layers.
 *     responses:
 *       200:
 *         description: Infrastructure diagrams
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InfrastructureDiagrams'
 */
router.get('/diagrams', authMiddleware, async (req, res) => {
    try {
        const { type = 'all', format = 'svg' } = req.query;
        const diagrams = await diagramGenerator.generateDiagrams();

        if (type !== 'all') {
            const diagram = diagrams[type];
            res.json({
                success: true,
                data: {
                    type,
                    content: format === 'svg' ? diagram.svg : diagram.mermaid
                }
            });
        } else {
            res.json({
                success: true,
                data: Object.entries(diagrams).reduce((acc, [key, value]) => {
                    acc[key] = {
                        type: key,
                        content: format === 'svg' ? value.svg : value.mermaid
                    };
                    return acc;
                }, {})
            });
        }
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'infrastructure-diagrams-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'DiagramGenerationError'
            }
        });
    }
});

export default router; 