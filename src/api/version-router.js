import { Router } from 'express';
import { SystemMonitor } from '../monitoring/monitor';
import { ApiVersioning } from '../middleware/version.middleware';

const monitor = new SystemMonitor();

export class VersionRouter {
    constructor() {
        this.router = Router();
        this.versioning = new ApiVersioning();
        this.setupVersioning();
    }

    setupVersioning() {
        // Version 1.0.0 (Current)
        this.versioning.addVersion('1.0.0', {
            handlers: new Map(),
            router: Router()
        });

        // Version 2.0.0 (Beta)
        this.versioning.addVersion('2.0.0', {
            handlers: new Map(),
            router: Router()
        });

        // Deprecate old versions
        this.versioning.deprecateVersion('0.9.0');
    }

    addRoute(version, method, path, handler) {
        const versionHandler = this.versioning.getHandler(version);
        
        if (!versionHandler) {
            throw new Error(`Version ${version} not found`);
        }

        versionHandler.handlers.set(`${method}:${path}`, handler);
        versionHandler.router[method.toLowerCase()](path, async (req, res) => {
            try {
                await handler(req, res);
            } catch (error) {
                monitor.errorTracker.track(error, {
                    context: 'version-router-handler',
                    version,
                    method,
                    path
                });
                throw error;
            }
        });
    }

    getRouter() {
        return Router().use((req, res, next) => {
            const version = req.apiVersion;
            const versionHandler = this.versioning.getHandler(version);
            
            if (!versionHandler) {
                return next(new Error(`Version ${version} not found`));
            }

            return versionHandler.router(req, res, next);
        });
    }
} 