import { FlowSystem } from '../implementation';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('FlowSystem', () => {
  const testPattern = {
    id: 'test-1',
    name: 'Test Pattern',
    energy: {
      required: 10,
      current: 5
    },
    state: {
      active: true,
      strength: 0.5,
      stability: 0.7,
      evolution: 1
    }
  };

  let system;

  beforeEach(() => {
    vi.useFakeTimers();
    system = new FlowSystem([testPattern]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with valid state', () => {
    const state = system.getCurrentState();
    expect(state.type).toBe('focus');
    expect(state.depth).toBe(0.5);
    expect(state.patterns).toHaveLength(1);
    expect(state.patterns[0]).toEqual(testPattern);
  });

  it('transitions between states', () => {
    system.transition('deep');
    let state = system.getCurrentState();
    expect(state.type).toBe('deep');
    expect(state.depth).toBeGreaterThan(0.5);

    system.transition('peak');
    state = system.getCurrentState();
    expect(state.type).toBe('peak');
    expect(state.depth).toBe(1);

    system.transition('recovery');
    state = system.getCurrentState();
    expect(state.type).toBe('recovery');
    expect(state.depth).toBeLessThan(1);
  });

  it('adds patterns', () => {
    const newPattern = {
      ...testPattern,
      id: 'test-2'
    };

    system.addPattern(newPattern);
    const state = system.getCurrentState();
    
    expect(state.patterns).toHaveLength(2);
    expect(state.patterns[1]).toEqual(newPattern);
  });

  it('calculates metrics', () => {
    // Simulate some transitions
    system.transition('deep');
    vi.advanceTimersByTime(1000);
    system.transition('peak');
    vi.advanceTimersByTime(2000);
    system.transition('recovery');
    vi.advanceTimersByTime(500);

    const metrics = system.getMetrics();
    
    expect(metrics.transitionCount).toBe(3);
    expect(metrics.averageDepth).toBeGreaterThan(0);
    expect(metrics.totalDuration).toBeGreaterThan(0);
    expect(metrics.recoveryTime).toBeGreaterThan(0);
  });

  it('validates state transitions', () => {
    expect(() => {
      system.transition(undefined);
    }).toThrow('Invalid flow state transition');

    expect(() => {
      system.transition('invalid-state');
    }).toThrow('Invalid flow state transition');

    expect(() => {
      system.transition('deep', undefined);
    }).not.toThrow();
  });
}); 