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
        resonance: expect.any(Number)
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

    const statePromise = firstValueFrom(result.current.state$);

    act(() => {
      result.current.updateState({ state: FLOW_STATES.FLOW });
    });

    const newState = await statePromise;
    expect(newState).toEqual({ state: FLOW_STATES.FLOW });
  });

  it('should maintain type safety with protection updates', () => {
    const { result } = renderHook(() => useFlow());

    act(() => {
      result.current.updateProtection({ active: false });
    });

    expect(result.current.context.protection.active).toBe(false);
  });

  it('should handle pattern addition with history limits', () => {
    const { result } = renderHook(() => useFlow());

    const patterns = Array.from({ length: 3 }, (_, i) => ({
      id: String(i + 1),
      type: 'test'
    }));

    patterns.forEach(pattern => {
      act(() => {
        result.current.addPattern(pattern);
      });
    });

    expect(result.current.context.history.patterns).toHaveLength(3);
    expect(result.current.context.history.patterns[0].id).toBe('1');
    expect(result.current.context.history.patterns[2].id).toBe('3');
  });

  it('should automatically protect on low energy', () => {
    const { result } = renderHook(() => useFlow());

    act(() => {
      result.current.updateMetrics({ energy: 0.2 });
    });

    vi.advanceTimersByTime(1000);

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
      
      const statePromise = firstValueFrom(result.current.state$);
      
      act(() => {
        result.current.updateState({ state: FLOW_STATES.FLOW });
      });

      const state = await statePromise;
      expect(state).toEqual({ state: FLOW_STATES.FLOW });
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
      }).toThrow('Invalid metric value');
    });

    it('should combine multiple updates', async () => {
      const { result } = renderHook(() => useFlow());
      
      const contextPromise = firstValueFrom(result.current.context$);
      
      act(() => {
        result.current.updateMetrics({ energy: 0.8 });
        result.current.updateState({ state: FLOW_STATES.FLOW });
      });

      const context = await contextPromise;
      expect(context.metrics.energy).toBe(0.8);
      expect(context.state).toEqual({ state: FLOW_STATES.FLOW });
    });
  });
}); 