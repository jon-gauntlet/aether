import { renderHook, act } from '@testing-library/react-hooks';
import { useAutonomicDevelopment } from '../useAutonomicDevelopment';
import { Subject } from 'rxjs';
import { PatternState } from '../../../types/patterns';

describe('useAutonomicDevelopment', () => {
  let flow$: Subject<any>;
  let energy$: Subject<any>;
  let context$: Subject<any>;

  beforeEach(() => {
    flow$ = new Subject();
    energy$ = new Subject();
    context$ = new Subject();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    expect(result.current.state).toBeDefined();
    expect(result.current.state.energy).toBe(0.5);
    expect(result.current.state.context).toBe(0);
    expect(result.current.state.protection).toBe(0);
    expect(result.current.state.patterns).toEqual([]);
  });

  it('updates state based on flow changes', () => {
    const { result } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    act(() => {
      flow$.next({
        state: 'flow',
        metrics: {
          coherence: 0.8,
          resonance: 0.7
        }
      });
    });

    expect(result.current.state.energy).toBeGreaterThan(0.5);
    expect(result.current.state.context).toBeGreaterThan(0);
  });

  it('maintains energy levels within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    act(() => {
      // Simulate multiple energy updates
      for (let i = 0; i < 10; i++) {
        energy$.next({ level: Math.random() });
      }
    });

    expect(result.current.state.energy).toBeGreaterThanOrEqual(0);
    expect(result.current.state.energy).toBeLessThanOrEqual(1);
  });

  it('maintains context depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    act(() => {
      // Simulate multiple context updates
      for (let i = 0; i < 10; i++) {
        context$.next({ depth: Math.floor(Math.random() * 10) });
      }
    });

    expect(result.current.state.context).toBeGreaterThanOrEqual(0);
    expect(result.current.state.context).toBeLessThanOrEqual(5);
  });

  it('maintains protection depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    act(() => {
      // Simulate flow state that would increase protection
      flow$.next({
        state: 'deep_flow',
        metrics: {
          coherence: 0.9,
          resonance: 0.9
        }
      });
    });

    expect(result.current.state.protection).toBeGreaterThanOrEqual(0);
    expect(result.current.state.protection).toBeLessThanOrEqual(3);
  });

  it('recognizes and protects valuable states', () => {
    const { result } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    act(() => {
      // Simulate high value state
      flow$.next({
        state: 'deep_flow',
        metrics: {
          coherence: 0.95,
          resonance: 0.95
        }
      });

      energy$.next({ level: 0.9 });
      context$.next({ depth: 3 });
    });

    expect(result.current.state.protection).toBeGreaterThan(0);
    expect(result.current.state.patterns.some(p => 
      p.states.includes(PatternState.PROTECTED)
    )).toBe(true);
  });

  it('preserves context during protected states', () => {
    const { result } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    let initialContext: number;

    act(() => {
      // Establish protected state
      flow$.next({
        state: 'deep_flow',
        metrics: {
          coherence: 0.95,
          resonance: 0.95
        }
      });

      energy$.next({ level: 0.9 });
      context$.next({ depth: 3 });
      initialContext = result.current.state.context;

      // Attempt to change context
      context$.next({ depth: 1 });
    });

    expect(result.current.state.context).toBe(initialContext);
  });

  it('cleans up subscriptions on unmount', () => {
    const { unmount } = renderHook(() => useAutonomicDevelopment({
      flow$,
      energy$,
      context$
    }));

    const flowSpy = jest.spyOn(flow$, 'subscribe');
    const energySpy = jest.spyOn(energy$, 'subscribe');
    const contextSpy = jest.spyOn(context$, 'subscribe');

    unmount();

    expect(flowSpy).toHaveBeenCalled();
    expect(energySpy).toHaveBeenCalled();
    expect(contextSpy).toHaveBeenCalled();
  });
}); 