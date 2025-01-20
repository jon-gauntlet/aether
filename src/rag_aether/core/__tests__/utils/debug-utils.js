/**
 * Debug utilities focused on preventing delivery frustration
 * through early detection and clear diagnostics
 */

/**
 * Creates a debug context tracker for monitoring system behavior
 */
export const createDebugContext = () => ({
  transitions: [],
  errors: [],
  warnings: [],
  healthChecks: []
});

/**
 * Records state transitions with detailed context
 */
export const trackStateTransition = (context, before, after, operation) => {
  context.transitions.push({
    before,
    after,
    operation,
    timestamp: Date.now()
  });
};

/**
 * Validates state transition integrity
 */
export const validateStateTransition = (context, before, after, validators) => {
  validators.forEach(validator => {
    if (!validator(before, after)) {
      const error = new Error('Invalid state transition');
      context.errors.push(error);
      throw error;
    }
  });
};

/**
 * Records system health check with metrics
 */
export const recordHealthCheck = (context, metrics) => {
  context.healthChecks.push({
    timestamp: Date.now(),
    metrics
  });
};

/**
 * Analyzes debug context for potential issues
 */
export const analyzeDebugContext = (context) => {
  // Check for error patterns
  const errorPatterns = context.errors.map(e => e.message);
  if (errorPatterns.length > 0) {
    context.warnings.push(`Detected error patterns: ${errorPatterns.join(', ')}`);
  }

  // Check health degradation
  const healthChecks = context.healthChecks;
  if (healthChecks.length >= 2) {
    const latest = healthChecks[healthChecks.length - 1].metrics;
    const previous = healthChecks[healthChecks.length - 2].metrics;
    
    if (latest.health < previous.health) {
      context.warnings.push('Health degradation detected');
    }
  }

  // Check transition frequency
  const recentTransitions = context.transitions.filter(
    t => Date.now() - t.timestamp < 1000
  );
  if (recentTransitions.length > 10) {
    context.warnings.push('High transition frequency detected');
  }

  return {
    errorCount: context.errors.length,
    warningCount: context.warnings.length,
    warnings: [...context.warnings],
    healthTrend: getHealthTrend(context.healthChecks),
    recommendations: generateRecommendations(context)
  };
};

/**
 * Calculates health trend from health checks
 */
const getHealthTrend = (healthChecks) => {
  if (healthChecks.length < 2) return 'insufficient_data';
  
  const latest = healthChecks[healthChecks.length - 1].metrics.health;
  const first = healthChecks[0].metrics.health;
  
  if (latest > first) return 'improving';
  if (latest < first) return 'degrading';
  return 'stable';
};

/**
 * Generates recommendations based on debug context
 */
const generateRecommendations = (context) => {
  const recommendations = [];

  if (context.errors.length > 0) {
    recommendations.push('Review error patterns and add preventive validation');
  }

  if (context.warnings.includes('Health degradation detected')) {
    recommendations.push('Implement additional health preservation measures');
  }

  if (context.transitions.length > 100) {
    recommendations.push('Consider optimizing state transition frequency');
  }

  return recommendations;
};

/**
 * Creates a protected execution context that preserves debug information
 */
export const withDebugProtection = (operation, context) => {
  try {
    const result = operation();
    return result;
  } catch (error) {
    context.errors.push(error);
    throw error;
  }
};

/**
 * Wraps test function with flow protection
 */
export const withFlowProtection = (testFn) => {
  return async () => {
    const startTime = Date.now();
    try {
      await testFn();
    } finally {
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn(`Test took ${duration}ms - consider optimizing`);
      }
    }
  };
}; 