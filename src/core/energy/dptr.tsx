import { renderHook, act } from '@testing-library/react-hooks';
import { useEnergy } from '../useEnergy';
import { EnergyType, FlowState } from '../types';

jest.useFakeTimers();

describe('useEnergy', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useEnergy());

    expect(result.current.energy).toEqual({
      current: 100,
      max: 100,
      type: EnergyType.Mental,
      flow: FlowState.Normal,
      meta: expect.objectContaining({
        duration: 0,
        source: 'initialization',
        triggers: [],
        notes: ''
      })
    });
  });

  it('should decay energy over time', () => {
    const { result } = renderHook(() => useEnergy());

    // Advance 10 minutes
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(result.current.energy.current).toBeLessThan(100);
  });

  it('should decay energy slower in flow state', () => {
    const { result } = renderHook(() => useEnergy());

    // Enter flow state
    act(() => {
      result.current.enterFlow('test');
    });

    const flowStart = result.current.energy.current;

    // Advance 10 minutes
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    const flowDecay = flowStart - result.current.energy.current;

    // Reset and test normal decay
    const { result: normalResult } = renderHook(() => useEnergy());
    const normalStart = normalResult.current.energy.current;

    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    const normalDecay = normalStart - normalResult.current.energy.current;

    expect(flowDecay).toBeLessThan(normalDecay);
  });

  it('should recover energy during rest', async () => {
    const { result } = renderHook(() => useEnergy());

    // Decay energy first
    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000);
    });

    const beforeRest = result.current.energy.current;

    // Rest for 5 minutes
    await act(async () => {
      await result.current.rest(300);
      jest.advanceTimersByTime(300 * 1000);
    });

    expect(result.current.energy.current).toBeGreaterThan(beforeRest);
  });

  it('should handle flow state transitions', () => {
    const { result } = renderHook(() => useEnergy());

    act(() => {
      result.current.enterFlow('test trigger');
    });

    expect(result.current.inFlow).toBe(true);
    expect(result.current.energy.flow).toBe(FlowState.Flow);
    expect(result.current.energy.meta.triggers).toContain('test trigger');

    act(() => {
      result.current.exitFlow('test exit');
    });

    expect(result.current.inFlow).toBe(false);
    expect(result.current.energy.flow).toBe(FlowState.Normal);
    expect(result.current.energy.meta.notes).toContain('Flow exit: test exit');
  });

  it('should handle energy boosts', () => {
    const { result } = renderHook(() => useEnergy());

    // Decay energy first
    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000);
    });

    const beforeBoost = result.current.energy.current;

    act(() => {
      result.current.boost(20, 'test boost');
    });

    expect(result.current.energy.current).toBe(Math.min(100, beforeBoost + 20));
    expect(result.current.energy.meta.source).toBe('test boost');
  });

  it('should track low and critical states', () => {
    const { result } = renderHook(() => useEnergy());

    // Not low initially
    expect(result.current.isLow).toBe(false);
    expect(result.current.isCritical).toBe(false);

    // Decay to low state
    act(() => {
      jest.advanceTimersByTime(120 * 60 * 1000);
    });

    expect(result.current.isLow).toBe(true);

    // Decay to critical state
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });

    expect(result.current.isCritical).toBe(true);
  });
}); 