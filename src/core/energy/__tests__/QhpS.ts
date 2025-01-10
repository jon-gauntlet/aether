import { renderHook, act } from '@testing-library/react-hooks';
import { useAutonomicDevelopment } from '../useAutonomicDevelopment';
import { Subject } from 'rxjs';
import { Flow, Energy, Context, AutonomicDevelopmentProps } from '../../../types/autonomic';

describe('useAutonomicDevelopment', () => {
  let flow$: Subject<Flow>;
  let energy$: Subject<Energy>;
  let context$: Subject<Context>;
  let props: AutonomicDevelopmentProps;

  beforeEach(() => {
    flow$ = new Subject<Flow>();
    energy$ = new Subject<Energy>();
    context$ = new Subject<Context>();
    props = { flow$, energy$, context$ };
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));

    expect(result.current.state).toBeDefined();
    expect(result.current.state.energy).toBe(0.5);
    expect(result.current.state.context).toBe(0);
    expect(result.current.state.protection).toBe(0);
    expect(result.current.state.patterns).toEqual([]);
  });

  it('updates state based on flow changes', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));

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
    const { result } = renderHook(() => useAutonomicDevelopment(props));

    act(() => {
      // Simulate multiple energy updates
      for (let i = 0; i < 10; i++) {
        energy$.next({ level: Math.random(), type: 'natural' });
      }
    });

    expect(result.current.state.energy).toBeGreaterThanOrEqual(0);
    expect(result.current.state.energy).toBeLessThanOrEqual(1);
  });

  it('maintains context depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));

    act(() => {
      // Simulate multiple context updates
      for (let i = 0; i < 10; i++) {
        context$.next({ depth: Math.floor(Math.random() * 10), tags: ['test'] });
      }
    });

    expect(result.current.state.context).toBeGreaterThanOrEqual(0);
    expect(result.current.state.context).toBeLessThanOrEqual(5);
  });

  it('maintains protection depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));

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

  it('preserves context during protected states', () => {
    const { result } = renderHook(() => useAutonomicDevelopment(props));

    let initialContext = 0;

    act(() => {
      // Establish protected state
      flow$.next({
        state: 'deep_flow',
        metrics: {
          coherence: 0.95,
          resonance: 0.95
        }
      });

      energy$.next({ level: 0.9, type: 'natural' });
      context$.next({ depth: 3, tags: ['test'] });
      initialContext = result.current.state.context;

      // Attempt to change context
      context$.next({ depth: 1, tags: ['test'] });
    });

    expect(result.current.state.context).toBe(initialContext);
  });

  it('cleans up subscriptions on unmount', () => {
    const { unmount } = renderHook(() => useAutonomicDevelopment(props));

    const flowSpy = jest.spyOn(flow$, 'subscribe');
    const energySpy = jest.spyOn(energy$, 'subscribe');
    const contextSpy = jest.spyOn(context$, 'subscribe');

    unmount();

    expect(flowSpy).toHaveBeenCalled();
    expect(energySpy).toHaveBeenCalled();
    expect(contextSpy).toHaveBeenCalled();
  });
}); 