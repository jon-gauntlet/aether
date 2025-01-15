import { isProtectionState } from '../../types/protection/protection';

const matchers = {
  toBeInRange(actual, min, max) {
    const pass = typeof actual === 'number' && actual >= min && actual <= max;
    return {
      message: () => pass
        ? `expected ${actual} not to be within range ${min} - ${max}`
        : `expected ${actual} to be within range ${min} - ${max}`,
      pass
    };
  },

  toBeValidFlowState(actual) {
    const state = actual;
    const pass = Boolean(
      state &&
      typeof state.active === 'boolean' &&
      typeof state.type === 'string' &&
      typeof state.intensity === 'number' &&
      typeof state.duration === 'number' &&
      typeof state.metrics === 'object' &&
      typeof state.lastTransition === 'number' &&
      typeof state.protected === 'boolean' &&
      typeof state.quality === 'number'
    );

    return {
      message: () => pass
        ? `expected ${JSON.stringify(actual)} not to be a valid FlowState`
        : `expected ${JSON.stringify(actual)} to be a valid FlowState`,
      pass
    };
  },

  toBeValidProtectionState(actual) {
    const pass = isProtectionState(actual);
    return {
      message: () => pass
        ? `expected ${JSON.stringify(actual)} not to be a valid ProtectionState`
        : `expected ${JSON.stringify(actual)} to be a valid ProtectionState`,
      pass
    };
  },

  toHaveValidMetrics(actual) {
    const metrics = actual;
    const pass = Boolean(
      metrics &&
      typeof metrics === 'object' &&
      Object.values(metrics).every(value => 
        typeof value === 'number' && value >= 0 && value <= 1
      )
    );

    return {
      message: () => pass
        ? `expected ${JSON.stringify(actual)} not to have valid metrics`
        : `expected ${JSON.stringify(actual)} to have valid metrics`,
      pass
    };
  }
};

expect.extend(matchers); 