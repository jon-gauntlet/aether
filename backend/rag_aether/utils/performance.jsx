import React from 'react';
import { createDebugger } from './debug';

const debug = createDebugger('Performance');

export const measureRender = (Component) => {
  const WrappedComponent = (props) => {
    const startTime = React.useRef(performance.now());
    const renderCount = React.useRef(0);
    
    React.useEffect(() => {
      const duration = performance.now() - startTime.current;
      renderCount.current += 1;
      
      if (duration > 16) { // 60fps threshold
        debug.warn(
          `Slow render in ${Component.name}:`,
          `${duration.toFixed(2)}ms`,
          `(render #${renderCount.current})`
        );
      }
      
      // Reset for next render
      startTime.current = performance.now();
    });
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `MeasuredRender(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export const useRenderTiming = (componentName) => {
  const startTime = React.useRef(performance.now());
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    const duration = performance.now() - startTime.current;
    renderCount.current += 1;
    
    debug.log(
      `[${componentName}] Render #${renderCount.current}:`,
      `${duration.toFixed(2)}ms`
    );
    
    // Reset for next render
    startTime.current = performance.now();
  });
};

export const trackMountTime = (Component) => {
  return function TrackedComponent(props) {
    const mountTime = React.useRef(performance.now());
    
    React.useEffect(() => {
      const duration = performance.now() - mountTime.current;
      debug.log(
        `[${Component.name}] Mount time:`,
        `${duration.toFixed(2)}ms`
      );
    }, []);
    
    return <Component {...props} />;
  };
};

export const measureAsyncOperation = async (operation, label) => {
  const start = performance.now();
  try {
    return await operation();
  } finally {
    const duration = performance.now() - start;
    debug.log(`${label}: ${duration.toFixed(2)}ms`);
  }
}; 