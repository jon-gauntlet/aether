import { SystemMonitor } from '../monitoring/monitor';
import semver from 'semver';

const monitor = new SystemMonitor();

export class ApiVersioning {
    constructor() {
        this.versions = new Map();
        this.deprecatedVersions = new Set();
        this.monitor = monitor;
    }

    addVersion(version, implementation) {
        this.versions.set(version, implementation);
    }

    deprecateVersion(version) {
        this.deprecatedVersions.add(version);
    }

    getHandler(version) {
        return this.versions.get(version);
    }

    isDeprecated(version) {
        return this.deprecatedVersions.has(version);
    }
}

export const createVersioningMiddleware = (apiVersioning) => {
    return (req, res, next) => {
        const version = req.headers['accept-version'] || 
                       req.query.version || 
                       process.env.API_DEFAULT_VERSION || 
                       '1.0.0';

        try {
            if (!semver.valid(version)) {
                throw new Error('Invalid version format');
            }

            const handler = apiVersioning.getHandler(version);
            
            if (!handler) {
                throw new Error(`API version ${version} not found`);
            }

            if (apiVersioning.isDeprecated(version)) {
                const warning = `API version ${version} is deprecated`;
                res.set('Warning', `299 - ${warning}`);
                monitor.logger.warn({
                    event: 'deprecated-version-used',
                    version,
                    path: req.path
                });
            }

            req.apiVersion = version;
            req.versionHandler = handler;
            
            next();
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'api-versioning',
                version,
                path: req.path
            });

            res.status(400).json({
                success: false,
                error: {
                    message: error.message,
                    code: 'INVALID_API_VERSION',
                    type: 'VersionError'
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    supportedVersions: Array.from(apiVersioning.versions.keys())
                }
            });
        }
    };
}; 