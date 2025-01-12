import { renderHook, act } from '@testing-library/react-hooks';
import { useFlow } from '../useFlow';
import type { FlowOptions } from '../../types/flow';
import { FLOW_STATES } from '../../types/flow';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

describe('useFlow', () => {
  it('should initialize with valid flow context', () => {
    const { result } = renderHook(() => useFlow());
    
    expect(result.current.context).toMatchObject({
      type: 'flow',
      state: FLOW_STATES.RESTING,
      metrics: expect.objectContaining({
        stability: expect.any(Number),
        coherence: expect.any(Number),
        resonance: expect.any(Number),
        quality: expect.any(Number)
      })
    });
  });

  it('should safely update metrics', () => {
    const { result } = renderHook(() => useFlow());

    act(() => {
      result.current.updateMetrics({
        energy: 0.8,
        focus: 0.9
      });
    });

    expect(result.current.context.metrics).toMatchObject({
      energy: 0.8,
      focus: 0.9
    });
  });

  it('should handle flow state transitions', () => {
    const { result } = renderHook(() => useFlow());

    act(() => {
      result.current.transitionTo(FLOW_STATES.FLOW, 'Test transition');
    });

    expect(result.current.context.state).toBe(FLOW_STATES.FLOW);
    expect(result.current.context.history.transitions).toHaveLength(1);
    expect(result.current.context.history.transitions[0]).toMatchObject({
      from: FLOW_STATES.RESTING,
      to: FLOW_STATES.FLOW,
      reason: 'Test transition'
    });
  });

  it('should maintain type safety with protection updates', () => {
    const { result } = renderHook(() => useFlow());

    act(() => {
      result.current.updateProtection({
        active: true,
        strength: 0.9
      });
    });

    expect(result.current.context.protection).toMatchObject({
      active: true,
      strength: 0.9
    });
  });

  it('should handle pattern addition with history limits', () => {
    const { result } = renderHook(() => 
      useFlow(crypto.randomUUID(), { historySize: 2 } as FlowOptions)
    );

    const pattern1 = {
      id: '1',
      type: 'test',
      strength: 0.8,
      resonance: 0.7,
      metrics: {
        stability: {
          current: 0.8,
          history: [0.7, 0.8]
        },
        coherence: {
          current: 0.8,
          history: [0.7, 0.8]
        },
        harmony: 0.8,
        evolution: {
          current: 0.8,
          history: [0.7, 0.8]
        },
        quality: 0.8
      }
    };

    const pattern2 = { ...pattern1, id: '2' };
    const pattern3 = { ...pattern1, id: '3' };

    act(() => {
      result.current.addPattern(pattern1);
      result.current.addPattern(pattern2);
      result.current.addPattern(pattern3);
    });

    expect(result.current.context.patterns).toHaveLength(2);
    expect(result.current.context.patterns[0].id).toBe('2');
    expect(result.current.context.patterns[1].id).toBe('3');
  });

  it('should automatically protect on low energy', () => {
    const { result } = renderHook(() => 
      useFlow(crypto.randomUUID(), {
        autoProtect: true,
        recoveryThreshold: 0.3
      } as FlowOptions)
    );

    act(() => {
      result.current.updateMetrics({
        energy: 0.2
      });
    });

    // Wait for protection check
    jest.advanceTimersByTime(1000);

    expect(result.current.context.protection.active).toBe(true);
    expect(result.current.context.state).toBe(FLOW_STATES.RECOVERING);
  });

  it('should maintain type safety with null updates', () => {
    const { result } = renderHook(() => useFlow());
    
    const updates: any[] = [];
    result.current.updates$.subscribe(update => updates.push(update));

    act(() => {
      result.current.updateMetrics({
        energy: 0.8
      });
    });

    expect(updates[0]).toBeNull(); // Initial state
    expect(updates[1]).toMatchObject({
      type: 'metrics',
      payload: expect.objectContaining({
        metrics: expect.objectContaining({
          energy: 0.8
        })
      })
    });
  });

  describe('stream operators', () => {
    it('should provide type-safe metric streams', async () => {
      const { result } = renderHook(() => useFlow());
      
      const metricsPromise = firstValueFrom(result.current.metrics$.pipe(take(1)));
      
      act(() => {
        result.current.updateMetrics({
          energy: 0.8,
          focus: 0.9
        });
      });

      const metrics = await metricsPromise;
      expect(metrics).toMatchObject({
        energy: 0.8,
        focus: 0.9
      });
    });

    it('should provide type-safe state streams', async () => {
      const { result } = renderHook(() => useFlow());
      
      const statePromise = firstValueFrom(result.current.state$.pipe(take(1)));
      
      act(() => {
        result.current.transitionTo(FLOW_STATES.FLOW);
      });

      const state = await statePromise;
      expect(state).toBe(FLOW_STATES.FLOW);
    });

    it('should provide type-safe context streams', async () => {
      const { result } = renderHook(() => useFlow());
      
      const contextPromise = firstValueFrom(result.current.context$.pipe(take(1)));
      
      act(() => {
        result.current.updateMetrics({
          energy: 0.8
        });
      });

      const context = await contextPromise;
      expect(context.metrics.energy).toBe(0.8);
      expect(context.timestamp).toBeGreaterThan(0);
    });

    it('should handle invalid updates gracefully', async () => {
      const { result } = renderHook(() => useFlow());
      
      const metricsPromise = firstValueFrom(result.current.metrics$.pipe(take(1)));
      
      act(() => {
        // @ts-ignore - Testing runtime validation
        result.current.updateMetrics({
          energy: 1.5 // Invalid value
        });
      });

      // Should maintain previous valid state
      const metrics = await metricsPromise;
      expect(metrics.energy).toBe(0); // Initial value
    });

    it('should combine multiple updates', async () => {
      const { result } = renderHook(() => useFlow());
      
      const contextPromise = firstValueFrom(result.current.context$.pipe(take(2)));
      
      act(() => {
        result.current.updateMetrics({
          energy: 0.8
        });
        result.current.transitionTo(FLOW_STATES.FLOW);
      });

      const context = await contextPromise;
      expect(context.metrics.energy).toBe(0.8);
      expect(context.state).toBe(FLOW_STATES.FLOW);
    });
  });

  it('should throw on invalid metric ranges', () => {
    const { result } = renderHook(() => useFlow());

    expect(() => {
      act(() => {
        result.current.updateMetrics({
          energy: 1.5 // Invalid range
        });
      });
    }).toThrow('energy must be between 0 and 1');
  });

  it('should throw on invalid protection values', () => {
    const { result } = renderHook(() => useFlow());

    expect(() => {
      act(() => {
        result.current.updateProtection({
          strength: -0.1 // Invalid range
        });
      });
    }).toThrow('strength must be between 0 and 1');
  });

  it('should validate flow state updates', () => {
    const { result } = renderHook(() => useFlow());
    
    expect(() => {
      act(() => {
        // @ts-ignore - Testing runtime validation
        result.current.transitionTo('INVALID_STATE');
      });
    }).toThrow('Invalid flow state');
  });
}); 