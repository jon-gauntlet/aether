import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { ApiDocumentationGenerator } from '../docs/api/documentation-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const docGenerator = new ApiDocumentationGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /docs:
 *   get:
 *     tags: [Documentation]
 *     summary: Get API documentation
 *     description: Returns the complete API documentation including OpenAPI specification
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, html]
 *         description: Documentation format
 *     responses:
 *       200:
 *         description: API documentation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/', async (req, res) => {
    try {
        const format = req.query.format || 'html';
        const documentation = await docGenerator.generateFullDocumentation();

        if (format === 'json') {
            res.json(documentation);
        } else {
            // Serve Swagger UI
            res.send(swaggerUi.generateHTML(documentation));
        }
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'api-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'DocumentationError'
            }
        });
    }
});

/**
 * @swagger
 * /docs/metrics:
 *   get:
 *     tags: [Documentation]
 *     summary: Get API documentation metrics
 *     security:
 *       - bearerAuth: []
 *     description: Returns metrics about the API documentation and usage
 *     responses:
 *       200:
 *         description: Documentation metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentationMetrics'
 */
router.get('/metrics', authMiddleware, async (req, res) => {
    try {
        const metrics = await docGenerator.getApiMetrics();
        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'documentation-metrics-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'MetricsError'
            }
        });
    }
});

export default router; 