import { FlowState } from '../../types/flow/types';
import { ProtectionState, isProtectionState } from '../../types/protection/protection';

type CustomMatcher = (this: jest.MatcherContext, actual: unknown, ...args: any[]) => jest.CustomMatcherResult;

const matchers: Record<string, CustomMatcher> = {
  toBeInRange(this: jest.MatcherContext, actual: unknown, min: number, max: number) {
    const pass = typeof actual === 'number' && actual >= min && actual <= max;
    return {
      message: () => pass
        ? `expected ${actual} not to be within range ${min} - ${max}`
        : `expected ${actual} to be within range ${min} - ${max}`,
      pass
    };
  },

  toBeValidFlowState(this: jest.MatcherContext, actual: unknown) {
    const state = actual as FlowState;
    const pass = Boolean(
      state &&
      typeof state.active === 'boolean' &&
      typeof state.type === 'string' &&
      typeof state.intensity === 'string' &&
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

  toBeValidProtectionState(this: jest.MatcherContext, actual: unknown) {
    const pass = isProtectionState(actual);
    return {
      message: () => pass
        ? `expected ${JSON.stringify(actual)} not to be a valid ProtectionState`
        : `expected ${JSON.stringify(actual)} to be a valid ProtectionState`,
      pass
    };
  },

  toHaveValidMetrics(this: jest.MatcherContext, actual: unknown) {
    const metrics = actual as Record<string, number>;
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