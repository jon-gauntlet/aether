import { SystemMonitor } from '../../monitoring/monitor';
import { PerformanceTracker } from '../../monitoring/performance-tracker';
import { CircuitBreaker } from './circuit-breaker';
import { RetryManager } from './retry-manager';
import { ServiceRegistry } from './service-registry';
import { ServiceHealthChecker } from './service-health-checker';

export class ServiceIntegrator {
    constructor() {
        this.monitor = new SystemMonitor();
        this.performanceTracker = new PerformanceTracker();
        this.circuitBreaker = new CircuitBreaker();
        this.retryManager = new RetryManager();
        this.serviceRegistry = new ServiceRegistry();
        this.healthChecker = new ServiceHealthChecker();
    }

    async executeServiceCall(serviceName, operation, params) {
        const startTime = process.hrtime();
        const callId = this.generateCallId();

        try {
            // Check service health
            await this.healthChecker.checkHealth(serviceName);

            // Get service configuration
            const serviceConfig = await this.serviceRegistry.getService(serviceName);

            // Execute with circuit breaker and retry
            const result = await this.circuitBreaker.execute(
                serviceName,
                () => this.retryManager.executeWithRetry(
                    () => this.makeServiceCall(serviceConfig, operation, params)
                )
            );

            // Track success metrics
            await this.trackSuccessMetrics(serviceName, operation, startTime, callId);

            return result;
        } catch (error) {
            // Track error metrics
            await this.trackErrorMetrics(serviceName, operation, error, callId);
            throw error;
        }
    }

    async makeServiceCall(serviceConfig, operation, params) {
        const { endpoint, timeout, headers } = this.prepareRequest(serviceConfig, operation);
        
        const response = await fetch(endpoint, {
            method: operation.method,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: params ? JSON.stringify(params) : undefined,
            timeout
        });

        if (!response.ok) {
            throw new Error(`Service call failed: ${response.statusText}`);
        }

        return response.json();
    }

    prepareRequest(serviceConfig, operation) {
        return {
            endpoint: `${serviceConfig.baseUrl}${operation.path}`,
            timeout: operation.timeout || serviceConfig.defaultTimeout,
            headers: {
                ...serviceConfig.headers,
                ...operation.headers
            }
        };
    }

    generateCallId() {
        return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async trackSuccessMetrics(serviceName, operation, startTime, callId) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        await this.performanceTracker.trackServiceCall({
            serviceName,
            operation: operation.name,
            duration,
            status: 'success',
            callId
        });
    }

    async trackErrorMetrics(serviceName, operation, error, callId) {
        await this.monitor.errorTracker.track(error, {
            context: 'service-integrator',
            serviceName,
            operation: operation.name,
            callId
        });
    }
}

export class CircuitBreaker {
    constructor() {
        this.states = new Map();
        this.monitor = new SystemMonitor();
    }

    async execute(serviceName, operation) {
        const state = await this.getCircuitState(serviceName);

        if (state.isOpen) {
            throw new Error('Circuit breaker is open');
        }

        try {
            const result = await operation();
            await this.recordSuccess(serviceName);
            return result;
        } catch (error) {
            await this.recordFailure(serviceName);
            throw error;
        }
    }

    async getCircuitState(serviceName) {
        let state = this.states.get(serviceName);
        
        if (!state) {
            state = {
                failures: 0,
                lastFailure: null,
                isOpen: false
            };
            this.states.set(serviceName, state);
        }

        return state;
    }

    async recordSuccess(serviceName) {
        const state = await this.getCircuitState(serviceName);
        state.failures = 0;
        state.isOpen = false;
    }

    async recordFailure(serviceName) {
        const state = await this.getCircuitState(serviceName);
        state.failures++;
        state.lastFailure = Date.now();

        if (state.failures >= 5) {
            state.isOpen = true;
            setTimeout(() => this.resetCircuit(serviceName), 30000);
        }
    }

    async resetCircuit(serviceName) {
        const state = await this.getCircuitState(serviceName);
        state.isOpen = false;
        state.failures = 0;
    }
}

export class RetryManager {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    async executeWithRetry(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries && this.shouldRetry(error)) {
                    await this.delay(this.calculateDelay(attempt, baseDelay));
                    continue;
                }
                
                break;
            }
        }

        throw lastError;
    }

    shouldRetry(error) {
        return error.status === 429 || // Rate limit
               error.status >= 500 ||  // Server errors
               error.code === 'ECONNRESET' || // Connection reset
               error.code === 'ETIMEDOUT';    // Timeout
    }

    calculateDelay(attempt, baseDelay) {
        return baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.monitor = new SystemMonitor();
    }

    async registerService(name, config) {
        this.validateServiceConfig(config);
        this.services.set(name, {
            ...config,
            registeredAt: Date.now()
        });
    }

    async getService(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not registered`);
        }
        return service;
    }

    validateServiceConfig(config) {
        const required = ['baseUrl', 'defaultTimeout', 'headers'];
        const missing = required.filter(field => !config[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }
}

export class ServiceHealthChecker {
    constructor() {
        this.monitor = new SystemMonitor();
        this.healthStates = new Map();
    }

    async checkHealth(serviceName) {
        const state = await this.getHealthState(serviceName);
        
        if (!state.healthy && !this.shouldRetryHealth(state)) {
            throw new Error(`Service ${serviceName} is unhealthy`);
        }

        if (this.shouldCheckHealth(state)) {
            await this.performHealthCheck(serviceName);
        }
    }

    async getHealthState(serviceName) {
        let state = this.healthStates.get(serviceName);
        
        if (!state) {
            state = {
                healthy: true,
                lastCheck: null,
                lastFailure: null,
                consecutiveFailures: 0
            };
            this.healthStates.set(serviceName, state);
        }

        return state;
    }

    shouldCheckHealth(state) {
        if (!state.lastCheck) return true;
        
        const timeSinceLastCheck = Date.now() - state.lastCheck;
        return timeSinceLastCheck > 60000; // Check every minute
    }

    shouldRetryHealth(state) {
        if (!state.lastFailure) return true;
        
        const timeSinceLastFailure = Date.now() - state.lastFailure;
        return timeSinceLastFailure > 300000; // Retry after 5 minutes
    }

    async performHealthCheck(serviceName) {
        const state = await this.getHealthState(serviceName);
        state.lastCheck = Date.now();

        try {
            // Implement actual health check logic here
            state.healthy = true;
            state.consecutiveFailures = 0;
        } catch (error) {
            state.healthy = false;
            state.lastFailure = Date.now();
            state.consecutiveFailures++;
            
            this.monitor.errorTracker.track(error, {
                context: 'service-health-check',
                serviceName
            });
        }
    }
} 