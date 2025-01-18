import express from 'express';
import { AuthService } from '../auth/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { SystemMonitor } from '../monitoring/monitor';

const router = express.Router();
const authService = new AuthService();
const monitor = new SystemMonitor();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.signUp({ email, password });
        res.status(201).json(result);
    } catch (error) {
        monitor.errorTracker.track(error, { 
            context: 'auth-signup-route',
            email: req.body.email 
        });
        res.status(400).json({
            error: error.message
        });
    }
});

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     tags: [Authentication]
 *     summary: Authenticate user and get token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 */
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.signIn({ email, password });
        res.status(200).json(result);
    } catch (error) {
        monitor.errorTracker.track(error, { 
            context: 'auth-signin-route',
            email: req.body.email 
        });
        res.status(401).json({
            error: error.message
        });
    }
});

router.post('/signout', authMiddleware, async (req, res) => {
    try {
        await authService.signOut(req.headers.authorization?.split(' ')[1]);
        res.status(200).json({ message: 'Signed out successfully' });
    } catch (error) {
        monitor.errorTracker.track(error, { 
            context: 'auth-signout-route',
            userId: req.user?.id 
        });
        res.status(500).json({
            error: error.message
        });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await authService.getUser(req.headers.authorization?.split(' ')[1]);
        res.status(200).json({ user });
    } catch (error) {
        monitor.errorTracker.track(error, { 
            context: 'auth-me-route',
            userId: req.user?.id 
        });
        res.status(500).json({
            error: error.message
        });
    }
});

export default router; 