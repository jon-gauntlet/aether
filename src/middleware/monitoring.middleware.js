import { SystemMonitor } from '../monitoring/monitor';

const monitor = new SystemMonitor();

export const monitoringMiddleware = (req, res, next) => {
    monitor.logRequest(req, res, next);
};

export const metricsMiddleware = (req, res) => {
    res.json(monitor.getMetrics());
}; 