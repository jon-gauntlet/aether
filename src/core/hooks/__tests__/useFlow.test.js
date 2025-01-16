import { renderHook, act } from '@testing-library/react-hooks';
import { useFlow } from '../useFlow';
import { FLOW_STATES } from '../../flow/constants';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

describe('useFlow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should initialize with valid flow context', () => {
    const { result } = renderHook(() => useFlow());

    expect(result.current.context).toMatchObject({
      metrics: expect.objectContaining({
        stability: expect.any(Number),
        coherence: expect.any(Number),
        resonance: expect.any(Number),
        energy: expect.any(Number)
      }),
      state: FLOW_STATES.RESTING,
      protection: expect.objectContaining({
        level: expect.any(Number),
        active: expect.any(Boolean)
      })
    });
  });

  it('should safely update metrics', () => {
    const { result } = renderHook(() => useFlow());

    act(() => {
      result.current.updateMetrics({ energy: 0.8 });
    });

    expect(result.current.context.metrics.energy).toBe(0.8);
  });

  it('should handle flow state transitions', async () => {
    const { result } = renderHook(() => useFlow());

    const statePromise = result.current.waitForStateUpdate(FLOW_STATES.FLOW);

    act(() => {
      result.current.updateState(FLOW_STATES.FLOW);
    });

    const newState = await statePromise;
    expect(newState).toBe(FLOW_STATES.FLOW);
  });

  it('should maintain type safety with protection updates', () => {
    const { result } = renderHook(() => useFlow());

    act(() => {
      result.current.updateProtection({ level: 0.9, active: true });
    });

    expect(result.current.context.protection.level).toBe(0.9);
    expect(result.current.context.protection.active).toBe(true);
  });

  it('should handle pattern addition with history limits', () => {
    const { result } = renderHook(() => useFlow({ historySize: 2 }));

    const pattern1 = { id: '1', type: 'test' };
    const pattern2 = { id: '2', type: 'test' };
    const pattern3 = { id: '3', type: 'test' };

    act(() => {
      result.current.addPattern(pattern1);
      result.current.addPattern(pattern2);
      result.current.addPattern(pattern3);
    });

    expect(result.current.context.history.patterns).toHaveLength(2);
    expect(result.current.context.history.patterns).toEqual([pattern2, pattern3]);
  });

  it('should automatically protect on low energy', () => {
    const { result } = renderHook(() => useFlow({ minEnergy: 0.3 }));

    act(() => {
      result.current.updateMetrics({ energy: 0.2 });
    });

    expect(result.current.context.protection.active).toBe(true);
    expect(result.current.context.protection.level).toBeGreaterThan(0);
  });

  describe('stream operators', () => {
    it('should provide type-safe metric streams', async () => {
      const { result } = renderHook(() => useFlow());

      const metricsPromise = firstValueFrom(result.current.metrics$);

      act(() => {
        result.current.updateMetrics({ energy: 0.8 });
      });

      const metrics = await metricsPromise;
      expect(metrics.energy).toBe(0.8);
    });

    it('should provide type-safe state streams', async () => {
      const { result } = renderHook(() => useFlow());

      const statePromise = result.current.waitForStateUpdate(FLOW_STATES.FLOW);

      act(() => {
        result.current.updateState(FLOW_STATES.FLOW);
      });

      const state = await statePromise;
      expect(state).toBe(FLOW_STATES.FLOW);
    });

    it('should provide type-safe context streams', async () => {
      const { result } = renderHook(() => useFlow());

      const contextPromise = firstValueFrom(result.current.context$);

      act(() => {
        result.current.updateMetrics({ energy: 0.8 });
      });

      const context = await contextPromise;
      expect(context.metrics.energy).toBe(0.8);
    });

    it('should handle invalid updates gracefully', () => {
      const { result } = renderHook(() => useFlow());

      expect(() => {
        act(() => {
          result.current.updateMetrics({ energy: 1.5 });
        });
      }).toThrow('Invalid energy value');
    });

    it('should combine multiple updates', async () => {
      const { result } = renderHook(() => useFlow());

      const statePromise = result.current.waitForStateUpdate(FLOW_STATES.FLOW);
      const contextPromise = result.current.waitForContextUpdate(context => 
        context.metrics.energy === 0.8 && context.state === FLOW_STATES.FLOW
      );

      act(() => {
        result.current.updateMetrics({ energy: 0.8 });
        result.current.updateState(FLOW_STATES.FLOW);
      });

      await statePromise;
      const context = await contextPromise;
      expect(context.metrics.energy).toBe(0.8);
      expect(context.state).toBe(FLOW_STATES.FLOW);
    });
  });
}); 