import { renderHook, act } from '@testing-library/react-hooks';
import { useFlow } from '../useFlow';
import { useEnergy } from '../../energy/useEnergy';
import { FlowState, EnergyType } from '../../types/base';

// Mock useEnergy hook
jest.mock('../../energy/useEnergy', () => ({
  useEnergy: jest.fn()
}));

describe('useFlow', () => {
  const mockEnergy = {
    mental: 1.0,
    physical: 1.0,
    emotional: 1.0
  };

  const mockEnergyMetrics = {
    efficiency: 0.8,
    sustainability: 0.9,
    recovery: 0.7
  };

  beforeEach(() => {
    (useEnergy as jest.Mock).mockReturnValue({
      energy: mockEnergy,
      consume: jest.fn(),
      startRecovery: jest.fn(),
      metrics: mockEnergyMetrics
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('State Management', () => {
    it('initializes with FOCUS state', () => {
      const { result } = renderHook(() => useFlow());
      expect(result.current.currentState).toBe(FlowState.FOCUS);
    });

    it('prevents rapid state transitions', () => {
      const { result } = renderHook(() => useFlow({ transitionDelay: 5 }));
      
      act(() => {
        result.current.transitionTo(FlowState.FLOW);
      });
      
      expect(result.current.canTransition(FlowState.HYPERFOCUS)).toBe(false);
    });

    it('enforces energy requirements for HYPERFOCUS', () => {
      (useEnergy as jest.Mock).mockReturnValue({
        energy: { mental: 0.5, physical: 0.5, emotional: 0.5 },
        consume: jest.fn(),
        startRecovery: jest.fn(),
        metrics: mockEnergyMetrics
      });

      const { result } = renderHook(() => useFlow());
      expect(result.current.canTransition(FlowState.HYPERFOCUS)).toBe(false);
    });
  });

  describe('Energy Integration', () => {
    it('consumes energy on HYPERFOCUS transition', () => {
      const mockConsume = jest.fn();
      (useEnergy as jest.Mock).mockReturnValue({
        energy: mockEnergy,
        consume: mockConsume,
        startRecovery: jest.fn(),
        metrics: mockEnergyMetrics
      });

      const { result } = renderHook(() => useFlow());
      
      act(() => {
        result.current.transitionTo(FlowState.HYPERFOCUS);
      });

      expect(mockConsume).toHaveBeenCalledWith(EnergyType.MENTAL, 0.3);
      expect(mockConsume).toHaveBeenCalledWith(EnergyType.PHYSICAL, 0.2);
      expect(mockConsume).toHaveBeenCalledWith(EnergyType.EMOTIONAL, 0.2);
    });

    it('enforces recovery when energy is low', () => {
      const mockStartRecovery = jest.fn();
      (useEnergy as jest.Mock).mockReturnValue({
        energy: { mental: 0.2, physical: 0.2, emotional: 0.2 },
        consume: jest.fn(),
        startRecovery: mockStartRecovery,
        metrics: mockEnergyMetrics
      });

      const { result } = renderHook(() => useFlow());
      
      act(() => {
        result.current.enforceRecovery();
      });

      expect(result.current.currentState).toBe(FlowState.RECOVERING);
      expect(mockStartRecovery).toHaveBeenCalled();
    });
  });

  describe('Optimization', () => {
    it('optimizes for FLOW when conditions are met', () => {
      (useEnergy as jest.Mock).mockReturnValue({
        energy: mockEnergy,
        consume: jest.fn(),
        startRecovery: jest.fn(),
        metrics: { ...mockEnergyMetrics, efficiency: 0.6 }
      });

      const { result } = renderHook(() => useFlow());
      
      act(() => {
        result.current.optimize(FlowState.FLOW);
      });

      expect(result.current.currentState).toBe(FlowState.FLOW);
    });

    it('optimizes for HYPERFOCUS when efficiency is high', () => {
      (useEnergy as jest.Mock).mockReturnValue({
        energy: mockEnergy,
        consume: jest.fn(),
        startRecovery: jest.fn(),
        metrics: { ...mockEnergyMetrics, efficiency: 0.8 }
      });

      const { result } = renderHook(() => useFlow());
      
      act(() => {
        result.current.optimize(FlowState.HYPERFOCUS);
      });

      expect(result.current.currentState).toBe(FlowState.HYPERFOCUS);
    });
  });

  describe('Duration Limits', () => {
    it('enforces maximum duration for HYPERFOCUS', () => {
      jest.useFakeTimers();
      const mockStartRecovery = jest.fn();
      
      (useEnergy as jest.Mock).mockReturnValue({
        energy: mockEnergy,
        consume: jest.fn(),
        startRecovery: mockStartRecovery,
        metrics: mockEnergyMetrics
      });

      const { result } = renderHook(() => useFlow({ maxDuration: 5 }));
      
      act(() => {
        result.current.transitionTo(FlowState.HYPERFOCUS);
      });

      act(() => {
        jest.advanceTimersByTime(6000); // 6 seconds
      });

      expect(result.current.currentState).toBe(FlowState.RECOVERING);
      jest.useRealTimers();
    });
  });

  describe('Metrics Tracking', () => {
    it('tracks transition count', () => {
      const { result } = renderHook(() => useFlow());
      
      act(() => {
        result.current.transitionTo(FlowState.FLOW);
      });

      expect(result.current.metrics.transitions).toBe(1);
    });

    it('tracks duration', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useFlow());
      
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });

      expect(result.current.metrics.duration).toBe(5);
      jest.useRealTimers();
    });
  });

  describe('Protection Mechanisms', () => {
    it('auto-transitions to EXHAUSTED on critical energy', () => {
      (useEnergy as jest.Mock).mockReturnValue({
        energy: { mental: 0.05, physical: 0.05, emotional: 0.05 },
        consume: jest.fn(),
        startRecovery: jest.fn(),
        metrics: mockEnergyMetrics
      });

      const { result } = renderHook(() => useFlow());
      expect(result.current.currentState).toBe(FlowState.EXHAUSTED);
    });

    it('prevents transitions during recovery', () => {
      const { result } = renderHook(() => useFlow());
      
      act(() => {
        result.current.transitionTo(FlowState.RECOVERING);
      });

      expect(result.current.canTransition(FlowState.FLOW)).toBe(false);
    });
  });
}); 