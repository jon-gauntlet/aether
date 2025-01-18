import { SecurityManager } from '../security/security-manager';

const securityManager = new SecurityManager();

export const securityMiddleware = async (req, res, next) => {
    try {
        const token = await securityManager.validateRequest(req);
        req.user = token;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                message: error.message,
                type: 'SecurityError'
            }
        });
    }
}; 