import { renderHook, act } from '@testing-library/react-hooks';
import { useEnergy } from '../useEnergy';
import { EnergyType, FlowState } from '../types';

describe('useEnergy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useEnergy());
    
    expect(result.current.energy).toEqual({
      current: 100,
      max: 100,
      type: EnergyType.Mental,
      flow: FlowState.Normal,
      meta: expect.objectContaining({
        timestamp: expect.any(Date),
        duration: 0,
        source: 'initialization',
        triggers: [],
        notes: ''
      })
    });
  });

  it('should update energy level', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      result.current.updateEnergy(-20, 'test', 'energy decrease');
    });

    expect(result.current.energy.current).toBe(80);
    expect(result.current.energy.meta.source).toBe('test');
    expect(result.current.energy.meta.notes).toBe('energy decrease');
  });

  it('should not exceed max energy', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      result.current.updateEnergy(20, 'test');
    });

    expect(result.current.energy.current).toBe(100);
  });

  it('should not go below zero energy', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      result.current.updateEnergy(-120, 'test');
    });

    expect(result.current.energy.current).toBe(0);
  });

  it('should enter flow state on positive update', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      result.current.updateEnergy(10, 'flow trigger');
    });

    expect(result.current.energy.flow).toBe(FlowState.Flow);
  });

  it('should decay energy over time', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      jest.advanceTimersByTime(60000); // 1 minute
    });

    expect(result.current.energy.current).toBeLessThan(100);
  });

  it('should recover energy in recovery state', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      result.current.setFlowState(FlowState.Recovering);
      jest.advanceTimersByTime(60000); // 1 minute
    });

    expect(result.current.energy.current).toBeGreaterThan(0);
  });

  it('should apply flow bonus in flow state', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      result.current.setFlowState(FlowState.Flow);
      result.current.updateEnergy(10, 'flow bonus test');
    });

    expect(result.current.energy.current).toBeGreaterThan(100);
  });

  it('should track energy duration', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      jest.advanceTimersByTime(120000); // 2 minutes
    });

    expect(result.current.energy.meta.duration).toBeGreaterThan(0);
  });
}); 