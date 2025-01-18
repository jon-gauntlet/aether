import { VersionRouter } from '../api/version-router';
import { authMiddleware } from '../middleware/auth.middleware';
import { SystemMonitor } from '../monitoring/monitor';

const versionRouter = new VersionRouter();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get list of users
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersion'
 *     description: |
 *       Returns a list of users.
 *       
 *       Version differences:
 *       - 1.0.0: Basic user information
 *       - 2.0.0: Includes additional user metadata and activity stats
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid version specified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VersionError'
 */
versionRouter.addRoute('1.0.0', 'GET', '/users', async (req, res) => {
    // Version 1.0.0 implementation
});

versionRouter.addRoute('2.0.0', 'GET', '/users', async (req, res) => {
    // Version 2.0.0 implementation with enhanced features
});

/**
 * @swagger
 * /api/protected:
 *   get:
 *     tags: [Protected]
 *     summary: Access protected resource
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ApiVersion'
 *     description: |
 *       Access protected resources.
 *       
 *       Version differences:
 *       - 1.0.0: Basic authorization
 *       - 2.0.0: Enhanced authorization with role-based access
 *     responses:
 *       200:
 *         description: Protected resource
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
versionRouter.addRoute('1.0.0', 'GET', '/protected', authMiddleware, async (req, res) => {
    // Version 1.0.0 protected implementation
});

versionRouter.addRoute('2.0.0', 'GET', '/protected', authMiddleware, async (req, res) => {
    // Version 2.0.0 protected implementation
});

export default versionRouter.getRouter(); 