import { renderHook, act } from '@testing-library/react-hooks';
import { useEnergy } from '../useEnergy';
import { EnergyType, FlowState } from '../../types/base';

describe('useEnergy', () => {
  it('should initialize with default energy levels', () => {
    const { result } = renderHook(() => useEnergy());

    expect(result.current.energy).toEqual(expect.objectContaining({
      mental: expect.any(Number),
      physical: expect.any(Number),
      emotional: expect.any(Number)
    }));
  });

  it('should track energy consumption', () => {
    const { result } = renderHook(() => useEnergy());
    const initialMental = result.current.energy.mental;

    act(() => {
      result.current.consume(EnergyType.MENTAL, 0.2);
    });

    expect(result.current.energy.mental).toBe(initialMental - 0.2);
  });

  it('should recover energy over time', () => {
    const { result } = renderHook(() => useEnergy());
    
    act(() => {
      result.current.consume(EnergyType.PHYSICAL, 0.3);
      result.current.startRecovery();
    });

    // Fast-forward recovery cycle
    jest.advanceTimersByTime(5000);

    expect(result.current.energy.physical).toBeGreaterThan(0.7);
  });

  it('should optimize energy distribution', () => {
    const { result } = renderHook(() => useEnergy());

    act(() => {
      result.current.optimize(FlowState.FLOW);
    });

    expect(result.current.energy.mental).toBeGreaterThan(0.8);
    expect(result.current.flowEfficiency).toBeGreaterThan(0.7);
  });

  it('should track energy metrics', () => {
    const { result } = renderHook(() => useEnergy());

    expect(result.current.metrics).toEqual(expect.objectContaining({
      efficiency: expect.any(Number),
      sustainability: expect.any(Number),
      recovery: expect.any(Number)
    }));
  });

  it('should handle energy depletion', () => {
    const { result } = renderHook(() => useEnergy());

    act(() => {
      result.current.consume(EnergyType.MENTAL, 0.9);
    });

    expect(result.current.isDepletionWarning).toBe(true);
    expect(result.current.metrics.sustainability).toBeLessThan(0.3);
  });

  it('should manage flow state transitions', () => {
    const { result } = renderHook(() => useEnergy());

    act(() => {
      result.current.transitionTo(FlowState.HYPERFOCUS);
    });

    expect(result.current.currentState).toBe(FlowState.HYPERFOCUS);
    expect(result.current.energy.mental).toBeLessThan(0.9);
  });

  it('should calculate energy efficiency', () => {
    const { result } = renderHook(() => useEnergy());

    act(() => {
      result.current.optimize(FlowState.FLOW);
      result.current.consume(EnergyType.MENTAL, 0.2);
    });

    expect(result.current.calculateEfficiency()).toBeGreaterThan(0.7);
  });

  it('should enforce recovery periods', () => {
    const { result } = renderHook(() => useEnergy());

    act(() => {
      result.current.consume(EnergyType.MENTAL, 0.8);
      result.current.enforceRecovery();
    });

    expect(result.current.currentState).toBe(FlowState.RECOVERING);
    expect(result.current.isRecovering).toBe(true);
  });

  it('should predict energy needs', () => {
    const { result } = renderHook(() => useEnergy());

    const prediction = result.current.predictEnergyNeeds(FlowState.HYPERFOCUS);

    expect(prediction).toEqual(expect.objectContaining({
      mental: expect.any(Number),
      physical: expect.any(Number),
      emotional: expect.any(Number),
      duration: expect.any(Number)
    }));
  });
}); 