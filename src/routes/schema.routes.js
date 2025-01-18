import express from 'express';
import { SchemaDocumentationGenerator } from '../docs/database/schema';
import { DatabaseDiagramGenerator } from '../docs/database/diagram-generator';
import { SystemMonitor } from '../monitoring/monitor';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const schemaGenerator = new SchemaDocumentationGenerator();
const diagramGenerator = new DatabaseDiagramGenerator();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /schema:
 *   get:
 *     tags: [Database]
 *     summary: Get database schema documentation
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns comprehensive documentation about the database schema,
 *       including tables, relationships, indexes, and query patterns.
 *     responses:
 *       200:
 *         description: Schema documentation
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
 *                     tables:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TableInfo'
 *                     relationships:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Relationship'
 *                     indexes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/IndexInfo'
 *                     queryPatterns:
 *                       type: object
 *                       properties:
 *                         common:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/QueryPattern'
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const documentation = await schemaGenerator.generateSchemaDoc();
        res.json({
            success: true,
            data: documentation
        });
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'schema-documentation-endpoint'
        });
        res.status(500).json({
            success: false,
            error: {
                message: error.message,
                type: 'SchemaDocumentationError'
            }
        });
    }
});

/**
 * @swagger
 * /schema/diagram:
 *   get:
 *     tags: [Database]
 *     summary: Get database diagram
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [mermaid, svg]
 *         description: Output format for the diagram
 *     description: |
 *       Returns a visual representation of the database schema
 *       in either Mermaid markdown or SVG format.
 *     responses:
 *       200:
 *         description: Database diagram
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *           image/svg+xml:
 *             schema:
 *               type: string
 */
router.get('/diagram', authMiddleware, async (req, res) => {
    try {
        const format = req.query.format || 'mermaid';
        const mermaidMarkdown = await diagramGenerator.generateMermaidDiagram();

        if (format === 'svg') {
            const svg = await diagramGenerator.generateSVG(mermaidMarkdown);
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(svg);
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.send(mermaidMarkdown);
        }
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'schema-diagram-endpoint'
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