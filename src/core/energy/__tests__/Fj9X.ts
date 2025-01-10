import { renderHook, act } from '@testing-library/react-hooks';
import { useAutonomicSystem } from '../useAutonomicSystem';

describe('useAutonomicSystem', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    
    expect(result.current.state).toEqual({
      energy: {
        type: 'steady',
        flow: 'natural',
        level: 0.7
      },
      context: {
        depth: 0.5,
        patterns: ['Natural Flow', 'Deep Connection']
      },
      protection: {
        depth: 0.6,
        patterns: ['Flow State', 'Focus'],
        states: ['Active', 'Protected']
      }
    });
  });

  it('emits flow updates periodically', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const flowValues: any[] = [];

    const subscription = result.current.flow$.subscribe(value => {
      flowValues.push(value);
    });

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(flowValues.length).toBe(1);
    expect(flowValues[0]).toHaveProperty('energy.level');
    expect(flowValues[0]).toHaveProperty('context.depth');
    expect(flowValues[0]).toHaveProperty('protection.depth');

    subscription.unsubscribe();
  });

  it('maintains energy levels within valid range', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const flowValues: any[] = [];

    const subscription = result.current.flow$.subscribe(value => {
      flowValues.push(value);
    });

    // Advance timers multiple times
    act(() => {
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(3000);
      }
    });

    flowValues.forEach(value => {
      expect(value.energy.level).toBeGreaterThanOrEqual(0.5);
      expect(value.energy.level).toBeLessThanOrEqual(1);
    });

    subscription.unsubscribe();
  });

  it('maintains context depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const flowValues: any[] = [];

    const subscription = result.current.flow$.subscribe(value => {
      flowValues.push(value);
    });

    // Advance timers multiple times
    act(() => {
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(3000);
      }
    });

    flowValues.forEach(value => {
      expect(value.context.depth).toBeGreaterThanOrEqual(0.3);
      expect(value.context.depth).toBeLessThanOrEqual(1);
    });

    subscription.unsubscribe();
  });

  it('maintains protection depth within valid range', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const flowValues: any[] = [];

    const subscription = result.current.flow$.subscribe(value => {
      flowValues.push(value);
    });

    // Advance timers multiple times
    act(() => {
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(3000);
      }
    });

    flowValues.forEach(value => {
      expect(value.protection.depth).toBeGreaterThanOrEqual(0.4);
      expect(value.protection.depth).toBeLessThanOrEqual(1);
    });

    subscription.unsubscribe();
  });

  it('preserves energy type during state updates', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const initialType = result.current.state.energy.type;

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.state.energy.type).toBe(initialType);
  });

  it('preserves flow type during state updates', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const initialFlow = result.current.state.energy.flow;

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.state.energy.flow).toBe(initialFlow);
  });

  it('maintains pattern consistency during state updates', () => {
    const { result } = renderHook(() => useAutonomicSystem());
    const initialPatterns = result.current.state.context.patterns;

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.state.context.patterns).toEqual(initialPatterns);
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = renderHook(() => useAutonomicSystem());
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
}); 