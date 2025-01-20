import { AppError } from './errors';

export const DEBUG = process.env.NODE_ENV !== 'production';

class DebugLogger {
  constructor(componentName) {
    this.componentName = componentName;
    this.timers = new Map();
  }

  log(...args) {
    if (DEBUG) {
      console.log(`[${this.componentName}]`, ...args);
    }
  }

  warn(...args) {
    if (DEBUG) {
      console.warn(`[${this.componentName}]`, ...args);
    }
  }

  error(...args) {
    if (DEBUG) {
      console.error(`[${this.componentName}]`, ...args);
    }
  }

  time(label) {
    if (DEBUG) {
      this.timers.set(label, performance.now());
    }
  }

  timeEnd(label) {
    if (DEBUG && this.timers.has(label)) {
      const duration = performance.now() - this.timers.get(label);
      this.log(`${label}: ${duration.toFixed(2)}ms`);
      this.timers.delete(label);
    }
  }

  measure(callback, label) {
    if (!DEBUG) return callback();
    
    this.time(label);
    try {
      return callback();
    } finally {
      this.timeEnd(label);
    }
  }
}

export const createDebugger = (componentName) => new DebugLogger(componentName);

export const assert = (condition, message) => {
  if (DEBUG && !condition) {
    throw new ValidationError(message);
  }
};

export const validateState = (state, schema) => {
  if (DEBUG) {
    try {
      schema.parse(state);
    } catch (error) {
      console.error('Invalid state:', error);
      throw new ValidationError('State validation failed');
    }
  }
};

// Performance monitoring hooks
export const useRenderCount = (componentName) => {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    if (DEBUG) {
      renderCount.current += 1;
      console.log(`[${componentName}] render #${renderCount.current}`);
    }
  });
};

export const useStateLogger = (componentName, state) => {
  React.useEffect(() => {
    if (DEBUG) {
      console.log(`[${componentName}] State updated:`, state);
    }
  }, [componentName, state]);
};

// Performance monitoring HOC
export const withPerformanceMonitoring = (Component) => {
  if (!DEBUG) return Component;
  
  const WrappedComponent = (props) => {
    const startTime = React.useRef();
    const componentName = Component.displayName || Component.name;
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      if (renderTime > 16) { // 60fps threshold
        console.warn(`[${componentName}] Slow render: ${renderTime.toFixed(2)}ms`);
      }
    });
    
    startTime.current = performance.now();
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `WithPerformance(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 